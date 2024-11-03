import type { Hono } from "jsr:@hono/hono"
import type { PrismaClient } from "../../../generated/client/deno/edge.ts"

import { verifySession } from "../session.ts"

export function API(app: Hono, prisma: PrismaClient): void {
    app.get("/subscribe-schedule", async ctx => {
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
            await prisma.schedule.update({
                where: { id: scheduleId },
                data: {
                    subscribers: {
                        upsert: {
                            where: {
                                scheduleId_accountId: {
                                    scheduleId, accountId
                                }
                            },
                            create: {
                                accountId: accountId
                            },
                            update: {}
                        }
                    }
                }
            })

            return ctx.json({
                code: 200,
                message: "Successfully subscribed to schedule"
            }, 200)
        } catch (err) {
            if ((err as Record<string, unknown>).code === "P2025") {
                return ctx.json({
                    code: 403,
                    message: "Schedule doesn't exist"
                }, 403)
            }

            throw err
        }
    })
}
