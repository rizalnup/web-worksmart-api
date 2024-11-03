import type { Hono } from "jsr:@hono/hono"
import type { PrismaClient } from "../../../generated/client/deno/edge.ts"

import { compare } from "https://deno.land/x/bcrypt@v0.4.1/mod.ts"
import { newSession } from "../../session.ts"

export function API(app: Hono, prisma: PrismaClient): void {
    app.post("/login", async ctx => {
        const data = await ctx.req.json<LoginJSON>()

        const account = await prisma.account.findUnique({
            where: { number: data.number }
        })

        if (account === null || !(await compare(data.password, account.password))) {
            return ctx.json({
                code: 403,
                message: "Account doesn't exist"
            }, 403)
        }

        const session = await newSession(prisma, account.id)

        return ctx.json({
            id: session.id,
            exp: session.expireAt.toISOString(),
            code: 200,
            message: "Authenticated"
        }, 200)
    })
}

export interface LoginJSON {
    number: string
    password: string
}