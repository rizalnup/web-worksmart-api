import type { Hono } from "jsr:@hono/hono"
import type { PrismaClient } from "../../../generated/client/deno/edge.ts"

import { verifySession } from "../session.ts"

export function API(app: Hono, prisma: PrismaClient): void {
    app.post("/edit-schedule", async ctx => {
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

        const data = await ctx.req.json<EditScheduleJSON>()
        const scheduleId = ctx.req.query("scheduleId") ?? ""

        const schedule = await prisma.schedule.findUnique({
            where: { id: scheduleId },
            include: {
                types: true,
                owner: true,
                editors: {
                    include: {
                        account: true
                    }
                }
            }
        })

        if (!schedule) {
            return ctx.json({
                code: 403,
                message: "Schedule doesn't exist"
            }, 403)
        }

        if (schedule.ownerId !== accountId) {
            return ctx.json({
                code: 401,
                message: "Not authorized"
            }, 401)
        }

        let malformed = false

        if (data.name !== undefined && !(data.name.length > 0 && data.name.length <= 36)) {
            malformed = true
        }

        if (data.types !== undefined) {
            const existedTypes = new Set<string>(schedule.types.map(type => type.name))
            const dupeCheck = new Set<string>()

            for (const type of data.types.add) {
                if (dupeCheck.has(type)) {
                    malformed = true
                }

                if (!(type.length > 0 && type.length <= 36)) {
                    malformed = true
                }

                if (existedTypes.has(type)) {
                    malformed = true
                }
    
                dupeCheck.add(type)
            }

            for (const type of data.types.remove) {
                if (dupeCheck.has(type)) {
                    malformed = true
                }

                if (!(type.length > 0 && type.length <= 36)) {
                    malformed = true
                }

                if (!existedTypes.has(type)) {
                    malformed = true
                }
    
                dupeCheck.add(type)
            }

            for (const type of data.types.modify) {
                if (dupeCheck.has(type.old)) {
                    malformed = true
                }

                if (!(type.old.length > 0 && type.old.length <= 36)) {
                    malformed = true
                }

                if (!existedTypes.has(type.old)) {
                    malformed = true
                }
    
                dupeCheck.add(type.old)

                if (dupeCheck.has(type.new)) {
                    malformed = true
                }

                if (!(type.new.length > 0 && type.new.length <= 36)) {
                    malformed = true
                }

                if (existedTypes.has(type.new)) {
                    malformed = true
                }
    
                dupeCheck.add(type.new)
            }
        }

        if (data.editors !== undefined) {
            const scheduleEditors = schedule.editors.map(editor => editor.account.number)
            const existedEditors = new Set(scheduleEditors)
            const dupeCheck = new Set<string>()

            for (const editor of data.editors.add) {
                if (dupeCheck.has(editor)) {
                    malformed = true
                }

                if (!(editor.length >= 10 && editor.length <= 16)) {
                    malformed = true
                }

                if (existedEditors.has(editor)) {
                    malformed = true
                }

                dupeCheck.add(editor)
            }

            for (const editor of data.editors.remove) {
                if (dupeCheck.has(editor)) {
                    malformed = true
                }

                if (!(editor.length >= 10 && editor.length <= 16)) {
                    malformed = true
                }

                if (!existedEditors.has(editor)) {
                    malformed = true
                }

                if (editor === schedule.owner.number) {
                    malformed = true
                }

                dupeCheck.add(editor)
            }
        }

        if (malformed) {
            return ctx.json({
                code: 400,
                message: "Malformed request"
            }, 400)
        }

        const scheduleName = data.name !== undefined ? data.name : schedule.name
        const types = data.types ?? { add: [], remove: [], modify: [] }

        const editorsNumber = data.editors ?? { add: [], remove: [] }

        const editorsAdd = await prisma.account.findMany({
            where: {
                number: {
                    in: editorsNumber.add
                }
            }
        })

        const editorsRemove = await prisma.account.findMany({
            where: {
                number: {
                    in: editorsNumber.remove
                }
            }
        })

        await prisma.schedule.update({
            where: { id: scheduleId },
            data: {
                name: scheduleName,
                types: {
                    create: types.add.map(type => {
                        return {
                            name: type
                        }
                    }),
                    delete: types.remove.map(type => {
                        return {
                            scheduleId_name: {
                                scheduleId, name: type
                            }
                        }
                    }),
                    update: types.modify.map(type => {
                        return {
                            where: {
                                scheduleId_name: {
                                    scheduleId, name: type.old
                                }
                            },
                            data: { name: type.new }
                        }
                    })
                },
                editors: {
                    upsert: editorsAdd.map(editor => {
                        return {
                            where: {
                                scheduleId_accountId: {
                                    scheduleId, accountId: editor.id
                                }
                            },
                            create: {
                                account: {
                                    connect: {
                                        id: editor.id
                                    }
                                }
                            },
                            update: {}
                        }
                    }),
                    delete: editorsRemove.map(editor => {
                        return {
                            scheduleId_accountId: {
                                scheduleId, accountId: editor.id
                            }
                        }
                    })
                },
                subscribers: {
                    upsert: editorsAdd.map(editor => {
                        return {
                            where: {
                                scheduleId_accountId: {
                                    scheduleId, accountId: editor.id
                                }
                            },
                            create: {
                                account: {
                                    connect: {
                                        id: editor.id
                                    }
                                }
                            },
                            update: {}
                        }
                    })
                }
            }
        })

        return ctx.json({
            code: 200,
            message: "Schedule successfully updated"
        }, 200)
    })
}

interface EditScheduleJSON {
    name?: string
    types?: {
        add: string[]
        remove: string[]
        modify: {
            old: string
            new: string
        }[]
    }
    editors?: {
        add: string[]
        remove: string[]
    }
}
