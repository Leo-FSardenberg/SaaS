import { api } from './api-client'
interface UpdateOrganizationRequest {
  org: string
  name: string
  domain: string | null
  shouldAttachUsersByDomain: boolean
}
// biome-ignore lint/suspicious/noConfusingVoidType: <explanation>
type UpdateOrganizationResponse = void
export async function updateOrganization({
  org,
  name,
  domain,
  shouldAttachUsersByDomain,
}: UpdateOrganizationRequest): Promise<UpdateOrganizationResponse> {
  await api.put(`organizations/${org}`, {
    json: {
      name,
      domain,
      shouldAttachUsersByDomain,
    },
  })
}
