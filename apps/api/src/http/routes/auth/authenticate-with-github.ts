import { prisma } from "@/lib/prisma";
import { env } from "@saas/env";
import { compare } from "bcryptjs";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";

export async function authenticateWithGithub(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().post('/sessions/github',
        {
            schema: {
                tags: ['auth'],
                summary: 'authenticate with Github',
                body: z.object({
                    code: z.string()
                }),
                response: {
                    400: z.object({ message: z.string() }),
                    201: z.object({ token: z.string() })
                }
            }
        },
        async (request, reply) => {
            const { code } = request.body

            const githubOAuthURL = new URL("https://github.com/login/oauth/access_token")

            githubOAuthURL.searchParams.set('client_id', env.GITHUB_OAUTH_CLIENT_ID)
            githubOAuthURL.searchParams.set('client_secret', env.GITHUB_OAUTH_CLIENT_SECRET)
            githubOAuthURL.searchParams.set('redirect_uri', env.GITHUB_OAUTH_CLIENT_REDIRECT_URI)
            githubOAuthURL.searchParams.set('code', code)

            const githubAccessTokenResponse = await fetch(githubOAuthURL, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                }
            })

            const githubAccessTokenData = await githubAccessTokenResponse.json()


            const { access_token } = z.object({
                access_token: z.string(),
                token_type: z.literal('bearer'),
                scope: z.string()
            }).parse(githubAccessTokenData)

            const githubUserResponse = await fetch('https://api.github.com/user', {
                headers: {
                    Authorization: `Bearer ${access_token}`
                }
            })

            const githubUserData = await githubUserResponse.json()

            const { id: githubId, name, email, avatar_url } = z.object({
                id: z.number().int().transform(String),
                avatar_url: z.string().url(),
                name: z.string().nullable(),
                email: z.string().email().nullable()
            }).parse(githubUserData)

            if (email === null) {
                throw new Error('Your Github account must have an e-mail to authenticate')
            }

            let user = await prisma.user.findUnique({
                where: { email },
            })
            if (!user) {
                user = await prisma.user.create({
                    data: {
                        name, email, avatarUrl: avatar_url,
                    }
                })
            }
            let account = await prisma.account.findUnique({
                where: {
                    provider_userId: {
                        provider: 'GITHUB',
                        userId: user.id,
                    }
                }
            })
            if (!account) {
                account = await prisma.account.create({
                    data: {
                        provider: 'GITHUB',
                        providerAccountId: githubId,
                        userId: user.id
                    }
                })
            }
            const token = await reply.jwtSign({
                sub: user.id,
            }, {
                sign: {
                    expiresIn: '2h'
                }
            })
            return reply.status(201).send({ token })
        });

}