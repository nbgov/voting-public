import type { CredentialsWalletStrategy, User, VotingServiceStrategy, VotingWalletStrategy } from '@smartapps-poll/common'
import type { EnvOptions } from '@vocdoni/sdk'
import type { DefualtEndpoints } from '../client/endpoints'
import type { WebClient } from '../client/types'
import { type Integration } from '../integration'
import type { VocdoniService } from '../service'
import { type WebStrategy } from '../startegy'
import type { i18n } from 'i18next'
import type { ModalManager } from '../component'
import type { FirebaseApp, FirebaseOptions } from 'firebase/app'
import type { Analytics } from 'firebase/analytics'

export interface CommonContext<Config extends CommonConfig = CommonConfig, Endpoints extends DefualtEndpoints = DefualtEndpoints> {
  user?: User
  firebase: FirebaseApp
  config: Config
  integration?: Integration
  web: WebClient
  endpoints: Endpoints
  vocdoni: VocdoniService
  strategy: WebStrategy
  i18n?: i18n
  modal: ModalManager
  isAuthenticated: () => boolean
  assertAuthentication: (message?: string) => void
  getApiConfiguration: () => APIConfigurationOverride
  getAnalytics: () => Analytics
}

export interface PartialCommonContext extends Omit<CommonContext, 'web' | 'vocdoni' | 'strategy' | 'firebase'> { }

export interface CommonConfig {
  apiUrl: string
  apiFireproxy: boolean
  fireproxyProject: string
  apiPickUpDelay: number
  vocdoni: VocdoniClientConfig
  debug?: {
    i18n?: boolean
  }
  apiOverrides?: APIConfigurationOverride[]
  firebase: FirebaseOptions
  hideProofspace: boolean
  hideTg: boolean
  geoCheckURL?: string
}

export interface APIConfigurationOverride {
  contextDomain: string
  url?: string
  fireproxy?: boolean
  vocdoni?: VocdoniClientConfig
  baseUrl?: string
}

export interface VocdoniClientConfig {
  env: EnvOptions
  fireproxy: boolean
}

export interface ContextStrategyUpdate {
  creds?: () => CredentialsWalletStrategy<CommonContext>
  service?: () => VotingServiceStrategy<CommonContext>
  wallet?: () => VotingWalletStrategy<CommonContext>
}
