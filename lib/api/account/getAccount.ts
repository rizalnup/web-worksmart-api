import type { Hono } from "jsr:@hono/hono"
import type { PrismaClient } from "../../../generated/client/deno/edge.ts"

import { verifySession } from "../../session.ts"

export function API(app: Hono, prisma: PrismaClient): void {
    app.get("get-account", async ctx => {
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

        const account = await prisma.account.findUnique({ where: { id: accountId }})

        if (!account) {
            return ctx.json({
                code: 403,
                message: "Account doesn't exist"
            }, 403)
        }

        return ctx.json({
            number: account.number,
            remindHour: account.remindHour,
            remindWhen: account.remindWhen,
            code: 200,
            message: "Account found"
        }, 200)
    })
}