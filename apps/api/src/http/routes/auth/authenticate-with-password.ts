import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";

export async function authenticateWithPassowrd(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().post('/sessions/password',
        {
            schema: {
                tags: ['auth'],
                summary: 'authenticate with password and e-mail',
                body: z.object({
                    email: z.string().email(),
                    password: z.string().min(7)
                }),
                response: {
                    400: z.object({ message: z.string() }),
                    201: z.object({ token: z.string() })
                }
            }
        },
        async (request, reply) => {
            const { email, password } = request.body

            const userFromEmail = await prisma.user.findUnique({
                where: { email }
            })

            if (!userFromEmail) {
                return reply.status(400).send({ message: 'invalid credentials!' })
            }

            if (userFromEmail.passwordHash === null) {
                return reply.status(400).send({ message: 'user only has social log-in registerd.' })
            }
            const isPasswordValid = await compare(password, userFromEmail.passwordHash)

            if (!isPasswordValid) {
                return reply.status(400).send({ message: 'invalid credentials!' })
            }



            const token = await reply.jwtSign({
                sub: userFromEmail.id,
            }, {
                sign: {
                    expiresIn: '2h'
                }
            })
            return reply.status(201).send({ token })
        });

}