import { ManagerWidget } from '@smartapps-poll/web-widget/dist/manager'
import type { FunctionComponent } from 'react'
import { config } from '../config'
// import { randomToken } from '@smartapps-poll/common'
import { useSearchParams } from 'react-router-dom'

export const ManagerScreen: FunctionComponent = () => {
  const [searchParams] = useSearchParams()

  const serviceId = searchParams.get('serviceId') ?? process.env.REACT_APP_SERIVCE_ID ?? ''
  const userId = searchParams.get('userId') ?? process.env.REACT_APP_DEBUG_USER_ID ?? ''
  const orgId = searchParams.get('orgId') ?? process.env.REACT_APP_DEBUG_ORG_ID ?? ''
  const userToken = searchParams.get('userToken') ?? process.env.REACT_APP_DEBUG_SERVICE_TOKEN ?? 'manager'
  const name = searchParams.get('orgName') ?? 'New Belarus'
  const shortDescr = searchParams.get('shortDescr') ?? undefined
  const logoUrl = searchParams.get('logoUrl') ?? undefined

  return <ManagerWidget config={{
    ...config, sharableBaseUrl: process.env.REACT_APP_SHARABLE_BASE_URL ?? '', debug: undefined
  }} params={{
    serviceId,
    authorization: { userId, orgId, userToken },
    org: { name, shortDescr, logoUrl }
  }} />
}
