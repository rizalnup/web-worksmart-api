import type { Hono } from "jsr:@hono/hono"
import type { PrismaClient } from "../../generated/client/deno/edge.ts"

import { newSession, verifySession } from "../session.ts"

export function API(app: Hono, prisma: PrismaClient): void {
    app.get("new-session", async ctx => {
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

        await prisma.accountSession.delete({
            where: { id: sessionId }
        })

        const session = await newSession(prisma, accountId)

        return ctx.json({
            id: session.id,
            exp: session.expireAt.toISOString(),
            code: 200,
            message: "Created new session"
        }, 200)
    })
}
