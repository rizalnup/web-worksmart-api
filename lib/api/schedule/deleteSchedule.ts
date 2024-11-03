import type { Hono } from "jsr:@hono/hono"
import type { PrismaClient } from "../../../generated/client/deno/edge.ts"

import { verifySession } from "../session.ts"

export function API(app: Hono, prisma: PrismaClient): void {
    app.get("/delete-schedule", async ctx => {
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
            await prisma.schedule.delete({
                where: { id: scheduleId, ownerId: accountId }
            })
        } catch (err) {
            if ((err as Record<string, unknown>).code === "P2025") {
                return ctx.json({
                    code: 403,
                    message: "Failed to delete schedule"
                }, 403)
            }

            throw err
        }

        return ctx.json({
            code: 200,
            message: "Schedule deleted successfully"
        }, 200)
    })
}
