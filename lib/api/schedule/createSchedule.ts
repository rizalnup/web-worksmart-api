import type { Hono } from "jsr:@hono/hono"
import type { PrismaClient } from "../../../generated/client/deno/edge.ts"

import { verifySession } from "../session.ts"

export function API(app: Hono, prisma: PrismaClient): void {
    app.post("/create-schedule", async ctx => {
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

        const data = await ctx.req.json<CreateScheduleJSON>()

        let malformed = false

        if (!(data.name.length > 0 && data.name.length <= 36)) {
            malformed = true
        }

        if (!data.types.length) {
            malformed = true
        }

        const dupeCheck = new Set<string>()

        for (const type of data.types) {
            if (dupeCheck.has(type)) {
                malformed = true
            }

            if (!(type.length > 0 && type.length <= 36)) {
                malformed = true
            }

            dupeCheck.add(type)
        }

        if (malformed) {
            return ctx.json({
                code: 400,
                message: "Malformed request"
            }, 400)
        }

        const schedule = await prisma.schedule.create({
            data: {
                name: data.name,
                types: {
                    createMany: {
                        data: data.types.map(type => {
                            return {
                                name: type
                            }
                        })
                    }
                },
                owner: {
                    connect: {
                        id: accountId
                    }
                },
                subscribers: {
                    create: {
                        account: {
                            connect: {
                                id: accountId
                            }
                        }
                    }
                },
                editors: {
                    create: {
                        account: {
                            connect: {
                                id: accountId
                            }
                        }
                    }
                }
            }
        })

        return ctx.json({
            id: schedule.id,
            code: 200,
            message: "Schedule successfully created"
        }, 200)
    })
}

interface CreateScheduleJSON {
    name: string
    types: string[]
}
