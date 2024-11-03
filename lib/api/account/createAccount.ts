import type { Hono } from "jsr:@hono/hono"
import type { PrismaClient } from "../../../generated/client/deno/edge.ts"

import { hash, genSalt } from "https://deno.land/x/bcrypt@v0.4.1/mod.ts"

export function API(app: Hono, prisma: PrismaClient): void {
    app.post("/create-account", async ctx => {
        const data = await ctx.req.json<CreateAccountJSON>()

        let malformed = false

        if (!(data.number.length >= 10 || data.number.length <= 16)) {
            malformed = true
        }

        if (!(data.password.length > 0 && data.password.length <= 36)) {
            malformed = true
        }

        if (!(data.remindHour >= 0 && data.remindHour <= 23)) {
            malformed = true
        }

        if (!(data.remindWhen >= 0 && data.remindWhen <= 7)) {
            malformed = true
        }

        if (malformed) {
            return ctx.json({
                code: 400,
                message: "Malformed request"
            }, 400)
        }

        const availableAcc = await prisma.account.findUnique({
            where: { number: data.number }
        })

        if (availableAcc) {
            return ctx.json({
                code: 403,
                message: "Account already exists"
            }, 403)
        }

        const salt = await genSalt()
        const password = await hash(data.password, salt)

        await prisma.account.create({
            data: {
                number: data.number,
                password: password,
                remindHour: data.remindHour,
                remindWhen: data.remindWhen
            },
        })

        return ctx.json({
            code: 200,
            message: "Account created"
        }, 200)
    })
}

interface CreateAccountJSON {
    number: string
    password: string
    remindHour: number
    remindWhen: number
}
