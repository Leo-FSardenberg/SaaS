import { ability, getCurrentOrg } from '@/auth/auth'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { getOrganization } from '@/http/get-organization'

import { OrganizationForm } from '../../organization-form'
import { Billing } from './billing'
import { ShutdownOrgButton } from './shutdown-org-button'

export default async function Settings() {
  const currentOrg = getCurrentOrg()
  const permissions = await ability()

  const canUpdateOrg = permissions?.can('update', 'Organization')
  const canGetBilling = permissions?.can('get', 'Billing')
  const canShutdownOrg = permissions?.can('delete', 'Organization')

  // biome-ignore lint/style/noNonNullAssertion: <explanation>
  const { organization } = await getOrganization(currentOrg!)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="space-y-4">
        {canUpdateOrg && (
          <Card>
            <CardHeader>
              <CardTitle>Organization Settings</CardTitle>
              <CardDescription>
                Update your Organization details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OrganizationForm
                isUpdating
                initialData={{
                  name: organization.name,
                  domain: organization.domain,
                  shouldAttachUsersByDomain:
                    organization.shouldAttachUsersByDomain,
                }}
              />
            </CardContent>
          </Card>
        )}
        {canGetBilling && <Billing />}

        {canShutdownOrg && (
          <Card>
            <CardHeader>
              <CardTitle>Shutdown Organization</CardTitle>
              <CardDescription>
                This will delete all organization data, including all projects.
                This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ShutdownOrgButton />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
