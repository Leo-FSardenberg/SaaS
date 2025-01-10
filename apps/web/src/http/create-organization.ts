import { api } from './api-client'
interface CreateOrganizationRequest {
  name: string
  domain: string | null
  shouldAttachUsersByDomain: boolean
}
// biome-ignore lint/suspicious/noConfusingVoidType: <explanation>
type CreateOrganizationResponse = void
export async function createOrganization({
  name,
  domain,
  shouldAttachUsersByDomain,
}: CreateOrganizationRequest): Promise<CreateOrganizationResponse> {
  await api.post('organizations', {
    json: {
      name,
      domain,
      shouldAttachUsersByDomain,
    },
  })
}
