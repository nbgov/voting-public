import { type IntegrationParams } from '@smartapps-poll/common'
import { type Config } from '../shared/types'

export const debugConfig: Config = {
  apiUrl: process.env.API_URL ?? 'http://localhost:8080',
  apiPickUpDelay: process.env.API_PICKUP_DELAY == null ? 2000 : parseInt(process.env.API_PICKUP_DELAY),
  apiFireproxy: false,
  fireproxyProject: '',
  vocdoni: {
    env: process.env.VOCDONI_ENV ?? 'dev' as any,
    fireproxy: false
  },
  debug: {
    auth: process.env.DEBUG_AUTH ?? undefined
  },
  hideProofspace: false,
  hideTg: false,
  firebase: {},
  sharableBaseUrl: process.env.SHARABLE_BASE_URL ?? 'http://localhost:3000'
}

export const debugIntegration: IntegrationParams = {
  serviceId: process.env.SERIVCE_ID ?? '',
  authorization: {
    userId: process.env.DEBUG_USER_ID ?? '',
    orgId: process.env.DEBUG_ORG_ID ?? '',
    userToken: process.env.DEBUG_SERVICE_TOKEN ?? 'manager'
  }
}
