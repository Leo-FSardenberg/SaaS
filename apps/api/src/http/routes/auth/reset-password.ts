
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'

export async function resetPassword(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().post(
        '/passwords/reset',
        {
            schema: {
                tags: ['Auth'],
                summary: 'Get unauthenticated user profile',
                body: z.object({
                    code: z.string(),
                    password: z.string().min(7),
                }),
                response: {
                    204: z.null(),
                },
            },
        },
        async (request, reply) => {
            const { code, password } = request.body

            const tokenFromCode = await prisma.token.findUnique({
                where: {
                    id: code
                }
            })

            if (!tokenFromCode) {
                throw new Error('unauthorized')
            }
            const passwordHash = await hash(password, 7)

            await prisma.$transaction([
                prisma.user.update({
                    where: {
                        id: tokenFromCode.userId,
                    },
                    data: {
                        passwordHash
                    },

                }),
                prisma.token.delete({
                    where: { id: code }
                })
            ])


            return reply.status(204).send()

        },
    )
}