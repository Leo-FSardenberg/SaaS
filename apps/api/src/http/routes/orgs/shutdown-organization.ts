import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { defineAbilityFor, organizationSchema, userSchema } from '@saas/auth'
import { UnauthorizedError } from "../_errors/unauthorized-error";
export async function shutdownOrganization(app: FastifyInstance) {
    app
        .withTypeProvider<ZodTypeProvider>()
        .register(auth)
        .delete(
            '/organizations/:slug',
            {
                schema: {
                    tags: ['Organizations'],
                    summary: 'Shutdown an organization',
                    security: [{ bearerAuth: [] }],
                    params: z.object({
                        slug: z.string(),
                    }),
                    response: {
                        204: z.null()
                    }
                },
            },
            async (request, reply) => {

                const { slug } = await request.params
                const userId = await request.getCurrentUserId()
                const { membership, organization } = await request.getUserMembership(slug)

                const authUser = userSchema.parse({
                    id: userId,
                    role: membership.role,
                })
                const authOrganization = organizationSchema.parse({ organization })

                const { cannot } = defineAbilityFor(authUser)

                if (cannot('delete', authOrganization)) {
                    throw new UnauthorizedError(`You're not allowed to shutdown this organization`)
                }

                await prisma.organization.delete({
                    where: {
                        id: organization.id,
                    }
                })


                return reply.status(204).send()
            },
        )
}
