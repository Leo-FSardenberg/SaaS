import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '@/http/middlewares/auth'
import { getUserPermissions } from '@/http/utils/get-user-permissions'
import { UnauthorizedError } from '../_errors/unauthorized-error'
import { prisma } from '@/lib/prisma'
import { createSlug } from '@/http/utils/create-slug'


export function createProject(app: FastifyInstance) {
    app
        .withTypeProvider<ZodTypeProvider>()
        .register(auth)
        .post(
            '/organizations/:slug/projects',
            {
                schema: {
                    tags: ['projects'],
                    summary: 'Create a new project',
                    security: [{ bearerAuth: [] }],
                    body: z.object({
                        name: z.string(),
                        description: z.string(),
                    }),
                    params: z.object({
                        slug: z.string(),
                    }),
                    response: {
                        201: z.object({
                            projectId: z.string().uuid(),
                        }),
                    },
                },
            },
            async (request, reply) => {
                const { slug } = request.params
                const userId = await request.getCurrentUserId()
                const { organization, membership } = await request.getUserMembership(slug)

                const { cannot } = getUserPermissions(userId, membership.role)

                if (cannot('create', 'Project')) {
                    throw new UnauthorizedError(`You're not authorized to create new projects`)
                }

                const { description, name } = request.body

                const project = await prisma.project.create({
                    data: {
                        name,
                        slug: createSlug(name),
                        description,
                        organizationId: organization.id,
                        ownerId: userId,
                    }
                })

                return reply.status(201).send({
                    projectId: project.id,
                })
            })

}