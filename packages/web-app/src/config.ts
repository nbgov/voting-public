import type { Config } from '@smartapps-poll/web-widget/dist/app'
import type { EnvOptions } from '@vocdoni/sdk'
import * as ethers from 'ethers'
import { DANGEROUS_COUNTRIES, PROOFSPACE_STRATEGY, TELEGRAM_STRATEGY, WEBPASS_STRATEGY, hydarteArgon, hydrateEthers } from '@smartapps-poll/common'
import { argon2id } from '@noble/hashes/argon2'
import { apiOverrides } from './api-overrides'

hydrateEthers(ethers)
hydarteArgon(argon2id) // @TODO There is missalignment with the server side implementation in terms of salt usage (not in use right now)

const noProxy = document.location.search.includes('noproxy=true') || process.env.REACT_APP_API_FIREPROXY === 'false'

const showProofspace = document.location.search.includes('showproofspace=true')
const showWebPass = document.location.search.includes('showwebpass=true')
const showTg = document.location.search.includes('showtg=true')

console.info('APP MODE', {
  debug: process.env.REACT_APP_DEBUG_MODE === 'true',
  env: process.env.NODE_ENV ?? 'production'
})

if ((process.env.NODE_ENV === 'development' || process.env.REACT_APP_DEBUG_MODE === 'true') && !noProxy) {
  DANGEROUS_COUNTRIES.push('PL')
  DANGEROUS_COUNTRIES.push('LT')
  DANGEROUS_COUNTRIES.push('UK')
}

export const config: Config = {
  apiUrl: process.env.REACT_APP_API_URL ?? '',
  apiFireproxy: (process.env.REACT_APP_API_FIREPROXY ?? 'true') === 'true',
  fireproxyProject: process.env.REACT_APP_FIREPROXY ?? '',
  apiPickUpDelay: parseInt(process.env.REACT_APP_API_PICKUP_DELAY ?? '3000'),
  hideProofspace: process.env.REACT_APP_HIDE_PROOFSPACE === 'true' && !showProofspace,
  hideTg: process.env.REACT_APP_HIDE_TELEGRAM === 'true' && !showTg,
  hideWebPass: process.env.REACT_APP_HIDE_WEBPASS === 'true' && !showWebPass,
  hiddenStrategies: [],
  vocdoni: {
    env: (process.env.REACT_APP_VOCDONI_ENV ?? 'dev') as EnvOptions,
    fireproxy: (process.env.REACT_APP_VOCDONI_FIREPROXY ?? 'true') === 'true'
  },
  baseUrl: process.env.REACT_APP_BASE_URL ?? '',
  debug: process.env.REACT_APP_HIDE_DEBUG !== 'true' && process.env.NODE_ENV === 'development'
    ? { auth: process.env.REACT_APP_DEBUG_AUTH ?? undefined }
    : undefined,
  firebase: {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY ?? '',
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID ?? '',
    appId: process.env.REACT_APP_FIREBASE_APP_ID ?? ''
  },
  geoCheckURL: process.env.REACT_APP_IPCHECK_URL,
  apiOverrides: apiOverrides(noProxy)
}

Object.entries({
  [PROOFSPACE_STRATEGY]: config.hideProofspace,
  [TELEGRAM_STRATEGY]: config.hideTg,
  [WEBPASS_STRATEGY]: config.hideWebPass
}).forEach(([strategy, hide]) => {
  if (hide) {
    config.hiddenStrategies.push(strategy)
  }
})
