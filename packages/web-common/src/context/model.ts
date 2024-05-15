import type { APIConfigurationOverride, CommonConfig, CommonContext, ContextStrategyUpdate, PartialCommonContext } from './types'
import type { DefualtEndpoints } from '../client/endpoints'
import type { Context as ReactContext } from 'react'

import { createContext, useContext } from 'react'
import { createWebClient } from '../client/web'
import { defaultEndpoints } from '../client/endpoints'
import { createVocdoniService } from '../service'
import { UnauthenticatedError } from './errors'
import { type WebStrategy, createDefaultStrategy } from '../startegy'
import { createBasicStrategyBuilder } from '@smartapps-poll/common'
import { buildModalManager } from '../model/modal'
import type { EnvOptions } from '@vocdoni/sdk'
import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'

export const buildCommonContext = (config: CommonConfig, endpoints?: DefualtEndpoints): CommonContext => {
  endpoints = endpoints ?? defaultEndpoints
  const _context: PartialCommonContext = {
    config,
    endpoints,

    modal: buildModalManager(),

    isAuthenticated: () =>
      context.strategy.isAuthenticated(),

    assertAuthentication: message => {
      if (!context.isAuthenticated()) {
        throw new UnauthenticatedError(message)
      }
    },

    getApiConfiguration: () => {
      const override: APIConfigurationOverride = {
        contextDomain: document.location.hostname,
        url: config.apiUrl,
        fireproxy: config.apiFireproxy,
        vocdoni: config.vocdoni
      }

      const _override = config.apiOverrides?.find(_override => override.contextDomain.endsWith(_override.contextDomain))
      if (_override != null) {
        override.url = _override.url ?? override.url
        override.fireproxy = _override.fireproxy !== undefined ? _override.fireproxy : override.fireproxy
        override.vocdoni = _override.vocdoni ?? override.vocdoni ?? {
          env: 'stg' as EnvOptions,
          fireproxy: false
        }
        override.vocdoni.env = _override.vocdoni?.env ?? override.vocdoni.env
        override.vocdoni.fireproxy = _override.vocdoni?.fireproxy !== undefined
          ? _override.vocdoni?.fireproxy
          : override.vocdoni.fireproxy
        override.baseUrl = _override.baseUrl
      }

      return override
    },

    getAnalytics: () => getAnalytics((_context as CommonContext).firebase)
  }

  const context: CommonContext = _context as unknown as CommonContext
  context.firebase = initializeApp(config.firebase, 'bppoll-app')
  context.web = createWebClient(context)
  context.vocdoni = createVocdoniService(context)
  context.strategy = createDefaultStrategy(context)

  return context
}

export const WebContext = createContext<CommonContext>({
  config: {} as any,
  firebase: {} as any,
  web: {} as any,
  endpoints: {} as any,
  vocdoni: {} as any,
  strategy: {} as any,
  modal: buildModalManager(),
  isAuthenticated: () => false,
  assertAuthentication: () => { },
  getApiConfiguration: () => ({}) as APIConfigurationOverride,
  getAnalytics: (() => { }) as any
})

export const updateContextStrategy = (context: CommonContext, update: ContextStrategyUpdate) => {
  const strategy: WebStrategy = createBasicStrategyBuilder(context)
    .credentials.wallet((update.creds != null) ? update.creds() : context.strategy.creds())
    .voting.wallet((update.wallet != null) ? update.wallet() : context.strategy.wallet())
    .voting.service((update.service != null) ? update.service() : context.strategy.service())
    .build()

  context.strategy = strategy
}

export const useCtx = <T extends CommonContext = CommonContext>(): T => {
  return useContext<T>(WebContext as unknown as ReactContext<T>)
}
