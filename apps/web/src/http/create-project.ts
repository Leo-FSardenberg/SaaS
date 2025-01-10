import { api } from './api-client'
interface CreateProjectRequest {
  org: string
  name: string
  description: string
}
// biome-ignore lint/suspicious/noConfusingVoidType: <explanation>
type CreateProjectResponse = void

export async function createProject({
  name,
  org,
  description,
}: CreateProjectRequest): Promise<CreateProjectResponse> {
  await api.post(`organizations/${org}/projects`, {
    json: {
      name,
      description,
    },
  })
}
