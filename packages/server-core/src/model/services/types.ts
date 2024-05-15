import type { IntegrationAuthorization } from '@smartapps-poll/common'

export interface ServiceAuthenticationRequest {
  url: string,
  payload: IntegrationAuthorization
}
