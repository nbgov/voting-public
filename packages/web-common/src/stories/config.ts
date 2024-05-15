import type { EnvOptions } from '@vocdoni/sdk'
import type { CommonConfig as Config } from '../context/types'

export const debugConfig: Config = {
  apiUrl: process.env.API_URL ?? 'http://localhost:8080',
  apiFireproxy: false,
  fireproxyProject: '',
  apiPickUpDelay: process.env.API_PICKUP_DELAY == null ? 2000 : parseInt(process.env.API_PICKUP_DELAY),
  hideProofspace: false,
  hideTg: false,
  vocdoni: {
    env: process.env.VOCDONI_ENV as EnvOptions ?? "dev",
    fireproxy: false
  },
  firebase: {}
}
