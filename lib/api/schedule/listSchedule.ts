import type { Hono } from "jsr:@hono/hono"
import type { PrismaClient } from "../../../generated/client/deno/edge.ts"

import { verifySession } from "../session.ts"

export function API(app: Hono, prisma: PrismaClient): void {
    app.get("/list-schedule", async ctx => {
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

        const account = (await prisma.account.findFirst({
            where: { id: accountId },
            select: {
                ownedSchedules: true,
                subscribedSchedules: {
                    select: {
                        schedule: true
                    }
                },
                editableSchedules: {
                    select: {
                        schedule: true
                    }
                }
            }
        }))!

        const schedules: Record<string, unknown> = {}

        account.ownedSchedules.forEach(schedule => {
            schedules[schedule.id] = schedule.name
        })

        account.editableSchedules.forEach(({ schedule }) => {
            schedules[schedule.id] = schedule.name
        })

        account.subscribedSchedules.forEach(({ schedule }) => {
            schedules[schedule.id] = schedule.name
        })

        return ctx.json({
            schedules: Object.keys(schedules).map(schedule => {
                return {
                    id: schedule,
                    name: schedules[schedule]
                }
            }),
            code: 200,
            message: "Schedules successfully retrieved"
        }, 200)
    })
}
