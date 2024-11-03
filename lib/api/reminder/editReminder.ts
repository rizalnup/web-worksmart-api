import type { Hono } from "jsr:@hono/hono"
import type { PrismaClient } from "../../../generated/client/deno/edge.ts"

import { verifySession } from "../session.ts"

export function API(app: Hono, prisma: PrismaClient): void {
    app.post("/edit-reminder", async ctx => {
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
        const data = await ctx.req.json<EditReminderJSON>()

        data.id = data.id ?? ""

        try {
            const reminder = await prisma.reminder.findUnique({
                where: {
                    id: data.id,
                    schedule: {
                        schedule: {
                            id: scheduleId,
                            editors: {
                                some: {
                                    accountId
                                }
                            }
                        }
                    }
                },
                include: {
                    schedule: {
                        select: {
                            schedule: {
                                select: {
                                    types: true
                                }
                            }
                        }
                    }
                }
            })
    
            if (!reminder) {
                return ctx.json({
                    code: 403,
                    message: "Reminder doesn't exist"
                }, 403)
            }
    
            let malformed = false
    
            if (data.type !== undefined) {
                if (!(data.type.length > 0 && data.type.length <= 36)) {
                    malformed = true
                }
    
                if (!reminder.schedule.schedule.types.map(type => type.name).includes(data.type)) {
                    malformed = true
                }
    
                reminder.type = data.type
            }
    
            if (data.date !== undefined) {
                if (isNaN(new Date(data.date).getTime())) {
                    malformed = true
                }
    
                reminder.date = new Date(data.date)
            }
    
            if (data.description !== undefined) {
                if (data.description !== null && !(data.description.length > 0 && data.description.length <= 65536)) {
                    malformed = true
                }
    
                reminder.description = data.description
            }
    
            if (data.done !== undefined) {
                if (typeof data.done !== "boolean") {
                    malformed = true
                }
    
                reminder.done = data.done
            }
    
            if (malformed) {
                return ctx.json({
                    code: 400,
                    message: "Malformed request"
                }, 400)
            }
    
            await prisma.reminder.update({
                where: {
                    id: data.id,
                    schedule: {
                        schedule: {
                            editors: {
                                some: {
                                    accountId
                                }
                            }
                        }
                    }
                },
                data: {
                    date: reminder.date,
                    description: reminder.description,
                    done: reminder.done,
                    type: reminder.type
                }
            })
    
            return ctx.json({
                code: 200,
                message: "Reminder successfully updated"
            }, 200)
        } catch (err) {
            if ((err as Record<string, unknown>).code === "P2025") {
                return ctx.json({
                    code: 403,
                    message: "Failed to edit reminder"
                }, 403)
            }
        }
    })
}

interface EditReminderJSON {
    id: string
    type?: string
    date?: string
    done?: boolean
    description?: string | null
}
