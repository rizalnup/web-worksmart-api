import type { Hono } from "jsr:@hono/hono"
import type { PrismaClient } from "../../generated/client/deno/edge.ts"

import { compare } from "https://deno.land/x/bcrypt@v0.4.1/mod.ts"

export function API(app: Hono, prisma: PrismaClient): void {
    app.post("delete-account", async ctx => {
        const data = await ctx.req.json<DeleteAccountJSON>()

        const account = await prisma.account.findUnique({
            where: { number: data.number }
        })

        if (!account || !(await compare(data.password, account.password))) {
            return ctx.json({
                code: 403,
                message: "Account doesn't exist"
            }, 403)
        }

        await prisma.account.delete({
            where: { id: account.id }
        })

        await prisma.accountSession.deleteMany({
            where: { accountId: account.id }
        })

        return ctx.json({
            code: 200,
            message: "Account successfully deleted"
        }, 200)
    })
}

interface DeleteAccountJSON {
    number: string
    password: string
}
