import type { Hono } from "jsr:@hono/hono"
import type { PrismaClient } from "../../../generated/client/deno/edge.ts"

import { hash, genSalt } from "https://deno.land/x/bcrypt@v0.4.1/mod.ts"
import { verifySession } from "../session.ts"

export function API(app: Hono, prisma: PrismaClient): void {
    app.post("/edit-account", async ctx => {
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

        const data = await ctx.req.json<EditAccountJSON>()

        let malformed = false

        if (data.number !== undefined) {
            if (!(data.number.length >= 10 || data.number.length <= 16)) {
                malformed = true
            } else {
                account.number = data.number
            }
        }

        if (data.remindHour !== undefined) {
            if (!(data.remindHour >= 0 && data.remindHour <= 23)) {
                malformed = true
            } else {
                account.remindHour = data.remindHour
            }
        }

        if (data.remindWhen !== undefined) {
            if (!(data.remindWhen >= 0 && data.remindWhen <= 7)) {
                malformed = true
            } else {
                account.remindWhen = data.remindWhen
            }
        }

        if (data.password !== undefined) {
            if (!(data.password.length > 0 && data.password.length <= 36)) {
                malformed = true
            } else {
                const salt = await genSalt()
                const password = await hash(data.password, salt)
                account.password = password
            }
        }

        if (malformed) {
            return ctx.json({
                code: 400,
                message: "Malformed request"
            }, 400)
        }

        await prisma.account.update({
            where: { id: account.id },
            data: {
                number: account.number,
                password: account.password,
                remindHour: account.remindHour,
                remindWhen: account.remindWhen
            }
        })

        return ctx.json({
            code: 200,
            message: "Account successfully updated"
        }, 200)
    })
}

interface EditAccountJSON {
    number?: string
    password?: string
    remindHour?: number
    remindWhen?: number
}
