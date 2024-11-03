import type { PrismaClient } from "../../generated/client/deno/edge.ts"

export async function manageSession(prisma: PrismaClient): Promise<void> {
    const date = new Date()
    await prisma.accountSession.deleteMany({
        where: {
            expireAt: {
                lte: date
            }
        }
    })
}

export async function verifySession(prisma: PrismaClient, id: string): Promise<string | null> {
    const session = await prisma.accountSession.findUnique({
        where: { id }
    })

    if (!session) return null
    if (new Date() > session.expireAt) return null

    return session.accountId
}

export async function newSession(prisma: PrismaClient, accountId: string): Promise<Session> {
    const expireAt = new Date(Date.now() + 1000 * Number(Deno.env.get("SESSION_EXP")))
    const session = await prisma.accountSession.create({
        data: { accountId, expireAt }
    })

    return {
        id: session.id,
        expireAt: session.expireAt
    }
}

export interface Session {
    id: string
    expireAt: Date
}
