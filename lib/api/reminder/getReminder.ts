import type { Hono } from "jsr:@hono/hono"
import type { PrismaClient } from "../../../generated/client/deno/edge.ts"

export function API(app: Hono, prisma: PrismaClient): void {
    app.get("/get-reminder", async ctx => {
        const scheduleId = ctx.req.query("scheduleId") ?? ""
        const queryType = ctx.req.query("type") ?? null
        const queryDay = ctx.req.query("day") ?? null
        const queryDone = ctx.req.query("done") === "1"

        const reminders: Reminder[] = []

        if (queryType) {
            const remindersQuery = await prisma.reminder.findMany({
                where: {
                    scheduleId,
                    type: queryType,
                    done: queryDone
                }
            })

            remindersQuery.forEach(reminder => {
                reminders.push({
                    id: reminder.id,
                    type: reminder.type,
                    date: reminder.date,
                    done: reminder.done,
                    description: reminder.description ?? undefined
                })
            })
        } else if (queryDay && isFinite(Number(queryDay)) && Number(queryDay) >= 0) {
            const queryDate = new Date(Date.now() + 1000 * 86400 * Number(queryDay))

            const remindersQuery = await prisma.reminder.findMany({
                where: {
                    scheduleId,
                    done: false,
                    date: {
                        lte: queryDate
                    }
                }
            })

            remindersQuery.forEach(reminder => {
                reminders.push({
                    id: reminder.id,
                    type: reminder.type,
                    date: reminder.date,
                    done: reminder.done,
                    description: reminder.description ?? undefined
                })
            })
        }

        return ctx.json({
            reminders,
            code: 200,
            message: "Successfully retrieved reminders"
        }, 200)
    })
}

interface Reminder {
    id: string
    type: string
    date: Date
    done: boolean
    description?: string
}
