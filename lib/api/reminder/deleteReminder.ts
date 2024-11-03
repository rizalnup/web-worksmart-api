import type { Hono } from "jsr:@hono/hono"
import type { PrismaClient } from "../../../generated/client/deno/edge.ts"

import { verifySession } from "../session.ts"

export function API(app: Hono, prisma: PrismaClient): void {
    app.post("/delete-reminder", async ctx => {
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
        const data = await ctx.req.json<DeleteReminderJSON>()

        let malformed = false

        if (!(data.type.length > 0 && data.type.length <= 36)) {
            malformed = true
        }

        if (malformed) {
            return ctx.json({
                code: 400,
                message: "Malformed request"
            }, 400)
        }

        try {
            await prisma.schedule.update({
                where: {
                    id: scheduleId,
                    editors: {
                        some: {
                            accountId
                        }
                    }
                },
                data: {
                    types: {
                        update: {
                            where: {
                                scheduleId_name: {
                                    scheduleId, name: data.type
                                }
                            },
                            data: {
                                reminders: {
                                    delete: {
                                        id: data.id
                                    }
                                }
                            }
                        }
                    }
                }
            })

            return ctx.json({
                code: 200,
                message: "Reminder successfully deleted"
            }, 200)
        } catch (err) {
            if ((err as Record<string, unknown>).code === "P2017") {
                return ctx.json({
                    code: 403,
                    message: "Failed to delete reminder"
                }, 403)
            }

            throw err
        }
    })
}

interface DeleteReminderJSON {
    id: string
    type: string
}
