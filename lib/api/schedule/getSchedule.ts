import type { Hono } from "jsr:@hono/hono"
import type { PrismaClient } from "../../../generated/client/deno/edge.ts"

import { verifySession } from "../session.ts"

export function API(app: Hono, prisma: PrismaClient): void {
    app.get("/get-schedule", async ctx => {
        const bearer = "Bearer "
        const bearerToken = ctx.req.header("Authorization") ?? ""
        const sessionId = bearerToken.substring(bearer.length)

        const accountId = await verifySession(prisma, sessionId)
        const scheduleId = ctx.req.query("scheduleId") ?? ""

        const scheduleEntry = await prisma.schedule.findUnique({
            where: { id: scheduleId },
            include: {
                types: true,
                subscribers: true,
                editors: {
                    include: {
                        account: true
                    }
                }
            }
        })

        if (!scheduleEntry) {
            return ctx.json({
                code: 403,
                message: "Schedule doesn't exist"
            }, 403)
        }

        const subscribers = scheduleEntry.subscribers.map(subscriber => subscriber.accountId)
        const editors = scheduleEntry.editors.map(editor => editor.accountId)

        const schedule: Schedule = {
            id: scheduleId,
            name: scheduleEntry.name,
            types: scheduleEntry.types.map(type => type.name),
            subscribed: accountId ? subscribers.includes(accountId) : false,
            editable: accountId ? editors.includes(accountId) : false
        }

        if (scheduleEntry.ownerId === accountId) {
            schedule.editors = scheduleEntry.editors.map(editor => editor.account.number)
        }

        return ctx.json({
            id: schedule.id,
            name: schedule.name,
            types: schedule.types,
            subscribed: schedule.subscribed,
            editable: schedule.editable,
            editors: schedule.editors,
            code: 200,
            message: "Schedule successfully retrieved"
        }, 200)
    })
}

interface Schedule {
    id: string
    name: string
    types: string[]
    subscribed: boolean
    editable: boolean
    editors?: string[]
}
