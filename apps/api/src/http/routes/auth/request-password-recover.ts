
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

export async function requestPasswordRecover(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().post(
        '/passwords/recover',
        {
            schema: {
                tags: ['Auth'],
                summary: 'Get authenticated user profile',
                body: z.object({
                    email: z.string().email()
                }),
                response: {
                    201: z.null(),
                },
            },
        },
        async (request, reply) => {
            const { email } = request.body

            const userFromEmail = await prisma.user.findUnique({
                where: {
                    email: email
                }
            })

            if (!userFromEmail) {
                return reply.status(201).send()
            }

            const { id: code } = await prisma.token.create({
                data: {
                    type: 'PASSWORD_RECOVER',
                    userId: userFromEmail.id,
                }
            })
            console.log({ code })
            //send psswd recover e-mail.
            return reply.status(201).send()

        },
    )
}