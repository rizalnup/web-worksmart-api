import type { Hono } from "jsr:@hono/hono"
import type { PrismaClient } from "../../../generated/client/deno/edge.ts"

import { verifySession } from "../session.ts"

export function API(app: Hono, prisma: PrismaClient): void {
    app.get("/unsubscribe-schedule", async ctx => {
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

        try {
            const schedule = await prisma.schedule.update({
                where: {
                    id: scheduleId
                },
                include: { subscribers: true },
                data: {
                    subscribers: {
                        delete: {
                            scheduleId_accountId: {
                                scheduleId, accountId
                            },
                            AND: [{
                                schedule: {
                                    editors: {
                                        none: {
                                            accountId
                                        }
                                    }
                                }
                            }]
                        }
                    }
                }
            })

            if (schedule.subscribers.map(subscriber => subscriber.accountId).includes(accountId)) {
                return ctx.json({
                    code: 403,
                    message: "Failed to unsubscribe from schedule"
                }, 403)
            }

            return ctx.json({
                code: 200,
                message: "Successfully unsubscribed from schedule"
            }, 200)
        } catch (err) {
            if ((err as Record<string, unknown>).code === "P2025") {
                return ctx.json({
                    code: 403,
                    message: "Failed to unsubscribe from schedule"
                }, 403)
            }

            if ((err as Record<string, unknown>).code === "P2017") {
                return ctx.json({
                    code: 403,
                    message: "Failed to unsubscribe from schedule"
                }, 403)
            }

            throw err
        }
    })
}
