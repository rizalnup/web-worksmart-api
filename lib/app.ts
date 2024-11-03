import { Hono } from "jsr:@hono/hono"
// @deno-types="../generated/client/deno/edge.ts"
import { PrismaClient } from "../generated/client/index.cjs"
import { expandGlob } from "jsr:@std/fs"
import { manageSession } from "./api/session.ts"

const prisma = new PrismaClient()
const app = new Hono()

app.onError((err, ctx) => {
    console.error(ctx.req.path, err)
    return ctx.json({
        code: 500,
        message: "The server had an error"
    }, 500)
})

const files = expandGlob("./lib/api/**/*.ts")
for await (const file of files) {
    const api: APIInterface = await import(`file:${file.path}`)
    if (api.API) await api.API(app, prisma)
}

await manageSession(prisma)
setInterval(() => manageSession(prisma).catch(err => console.error(err)), 1000 * 60 * 60)

Deno.serve({ port: Number(Deno.env.get("API_PORT")) }, app.fetch)

interface APIInterface {
    API(app: Hono, prisma: PrismaClient): Promise<void>
}
