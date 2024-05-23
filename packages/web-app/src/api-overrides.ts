import type { APIConfigurationOverride } from '@smartapps-poll/web-common'
import type { EnvOptions } from '@vocdoni/sdk'

export const apiOverrides = (noProxy: boolean): APIConfigurationOverride[] => [
  {
    contextDomain: 'googleusercontent.com',
    url: process.env.REACT_APP_DEBUG_MODE === 'true'
      ? 'https:/dev/api'
      : 'https://newbelarus-voting.com/api',
    fireproxy: !noProxy,
    vocdoni: {
      env: (process.env.REACT_APP_DEBUG_MODE === 'true' ? 'stg' : 'prod') as EnvOptions,
      fireproxy: !noProxy
    },
    baseUrl: process.env.REACT_APP_DEBUG_MODE === 'true'
      ? 'https://dev/index.html'
      : 'https://storage.cloud.google.com/nbvoting/index.html'
  },
  {
    contextDomain: 'storage.googleapis.com',
    url: process.env.REACT_APP_DEBUG_MODE === 'true'
      ? 'https://dev/api'
      : 'https://newbelarus-voting.com/api',
    fireproxy: !noProxy,
    vocdoni: {
      env: (process.env.REACT_APP_DEBUG_MODE === 'true' ? 'stg' : 'prod') as EnvOptions,
      fireproxy: !noProxy
    },
    baseUrl: process.env.REACT_APP_DEBUG_MODE === 'true'
      ? 'https://dev/index.html'
      : 'https://storage.googleapis.com/nbvoting/index.html'
  },
  {
    contextDomain: 'localhost',
    url: 'http://localhost/stage-api',
    fireproxy: false,
    vocdoni: {
      env: (process.env.REACT_APP_VOCDONI_ENV ?? 'dev') as EnvOptions,
      fireproxy: false
    },
    baseUrl: 'http://localhost'
  },
  {
    contextDomain: 'dev',
    url: 'https://dev/api',
    fireproxy: !noProxy,
    vocdoni: {
      env: (process.env.REACT_APP_VOCDONI_ENV ?? 'stg') as EnvOptions,
      fireproxy: !noProxy
    },
    baseUrl: 'https://dev'
  },
  {
    contextDomain: 'newbelarus-voting.com',
    url: 'https://newbelarus-voting.com/api',
    fireproxy: !noProxy,
    vocdoni: {
      env: 'prod' as EnvOptions,
      fireproxy: !noProxy
    },
    baseUrl: 'https://newbelarus-voting.com'
  }
]
