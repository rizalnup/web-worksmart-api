import type { Hono } from "jsr:@hono/hono"
import type { PrismaClient } from "../../../generated/client/deno/edge.ts"

import { verifySession } from "../session.ts"

export function API(app: Hono, prisma: PrismaClient): void {
    app.post("/create-reminder", async ctx => {
        const bearer = "Bearer "
        const bearerToken = ctx.req.header("Authorization") ?? ""
        const sessionId = bearerToken.substring(bearer.length)

        const accountId = await verifySession(prisma, sessionId)

        if (!accountId) {
            return ctx.json({
                code: 401,
                message: "Not authorized"
            }, 401)
        }

        const scheduleId = ctx.req.query("scheduleId") ?? ""
        const data = await ctx.req.json<CreateReminderJSON>()

        let malformed = false

        if (!(data.type.length > 0 && data.type.length <= 36)) {
            malformed = true
        }

        const reminderDate = new Date(data.date)

        if (isNaN(reminderDate.getTime())) {
            malformed = true
        }

        if (data.description !== undefined && !(data.description.length > 0 && data.description.length <= 65536)) {
            malformed = true
        }

        if (malformed) {
            return ctx.json({
                code: 400,
                message: "Malformed request"
            }, 400)
        }

        try {
            const reminder = await prisma.reminder.create({
                data: {
                    date: reminderDate,
                    description: data.description,
                    done: false,
                    schedule: {
                        connect: {
                            scheduleId_name: {
                                scheduleId, name: data.type
                            },
                            schedule: {
                                id: scheduleId,
                                editors: {
                                    some: {
                                        accountId
                                    }
                                }
                            }
                        }
                    }
                }
            })

            return ctx.json({
                id: reminder.id,
                code: 200,
                message: "Successfully created reminder"
            }, 200)
        } catch (err) {
            if ((err as Record<string, unknown>).code === "P2025") {
                return ctx.json({
                    code: 403,
                    message: "Failed to create reminder"
                }, 403)
            }

            throw err
        }
    })
}

interface CreateReminderJSON {
    type: string
    date: string
    description?: string
}
