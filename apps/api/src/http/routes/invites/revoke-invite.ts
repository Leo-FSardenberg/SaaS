import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '@/http/middlewares/auth'
import { UnauthorizedError } from '../_errors/unauthorized-error'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/http/utils/get-user-permissions'
import { BadRequestError } from '../_errors/bad-request'

export async function revokeInvite(app: FastifyInstance) {
    app
        .withTypeProvider<ZodTypeProvider>()
        .register(auth)
        .delete(
            '/organizations/:slug/invites/:inviteId',
            {
                schema: {
                    tags: ['Invites'],
                    summary: 'Revoke a new invite',
                    security: [{ bearerAuth: [] }],

                    params: z.object({
                        slug: z.string(),
                        inviteId: z.string().uuid(),
                    }),
                    response: {
                        204: z.null(),
                    },
                },
            },
            async (request, reply) => {
                const { slug, inviteId } = request.params
                const userId = await request.getCurrentUserId()
                const { organization, membership } =
                    await request.getUserMembership(slug)
                const { cannot } = getUserPermissions(userId, membership.role)
                if (cannot('delete', 'Invite')) {
                    throw new UnauthorizedError(
                        `You're not allowed to create new invites.`,
                    )
                }
                const invite = await prisma.invite.findUnique({
                    where: {
                        id: inviteId,
                        organizationId: organization.id,
                    },
                })
                if (!invite) {
                    throw new BadRequestError('Invite not found.')
                }
                await prisma.invite.delete({
                    where: {
                        id: inviteId,
                    },
                })


                reply.code(204).send()
            },
        )
}