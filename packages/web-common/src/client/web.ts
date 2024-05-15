import { integrationParamsToEntities, type Listed, type Poll, type PollInfo, type Member, type ProofspaceConfig, type User, type Organization } from '@smartapps-poll/common'
import axios from 'axios'
import type { CommonContext, PartialCommonContext } from '../context/types'
import type { AuthPickUpOptions, AuthPickup, Insist, WebClient } from './types'
import { ConnectionError, DuplicationError, WEB_STATUS_NO_CONTENT, WEB_STATUS_OK, WEB_STATUS_UNAUTHORIZED } from './errors'
import { IntegrationUnauthorizedError } from '../integration/errors'
import parseUrl from 'parse-url'

import { makeFireproxyAdapter } from './fireproxy'
import { applyRetrier } from './retrier'

export const createWebClient = (context: PartialCommonContext): WebClient => {
  const ep = context.endpoints

  const config = context.getApiConfiguration()

  const url = axios.create({
    baseURL: config.url,
    adapter: config.fireproxy ? makeFireproxyAdapter(context as CommonContext) : undefined,
    validateStatus: () => true
  })

  applyRetrier(url)

  const cache: { config: { proofsapce?: ProofspaceConfig } } = { config: {} }

  const _clinet: WebClient = {
    currentUrl: () => {
      return parseUrl(document.location.href)
    },

    client: () => url,

    authenticated: token => {
      _clinet.authToken = token
      url.defaults.headers.Authorization = token
    },

    unauthenticate: () => {
      delete _clinet.authToken
      delete url.defaults.headers.Authorization
    },

    authenticateToken: async token => {
      if (token !== undefined) {
        _clinet.authenticated(token)
      }
      if (_clinet.authToken === undefined) {
        return 'token.no'
      }
      const result = await url.get<User>(ep.auth.token)
      if (result.status !== WEB_STATUS_OK) {
        context.user = undefined
        return 'bad.response'
      }

      context.user = result.data

      return true
    },

    authenticateAndPickUp: async <T = string>(insist: Insist<T>, token?: string, options?: AuthPickUpOptions) => {
      const uri = options?.uri
      token = token ?? _clinet.authToken
      do {
        void await new Promise(resolve => setTimeout(resolve, context.config.apiPickUpDelay * 2))

        if (insist.stoped) {
          return undefined
        }
        const result = await url.get<AuthPickup<T>>(uri ?? ep.auth.pickup, {
          headers: {
            Authorization: token,
            Telegram: options?.tgToken
          },
        })
        if (insist.stoped) {
          return undefined
        }
        if (result.status === WEB_STATUS_OK) {
          insist.proceed = false
          if (insist.callback != null) {
            void insist.callback(result.data, token)
          }
          return result.data
        } else if (!result.status.toString().startsWith('2')) {
          throw new ConnectionError('server.unreacheable')
        }
        if (insist.proceed) {
          void await new Promise(resolve => setTimeout(resolve, context.config.apiPickUpDelay))
        }
      } while (insist.proceed)

      return undefined
    },

    authenticateAndPickUpPost: async <T = string>(insist: Insist<T>, body: Record<string, unknown>, token?: string, options?: AuthPickUpOptions) => {
      const uri = options?.uri
      token = token ?? _clinet.authToken
      do {
        void await new Promise(resolve => setTimeout(resolve, context.config.apiPickUpDelay * 2))

        if (insist.stoped) {
          return undefined
        }
        const result = await url.post<AuthPickup<T>>(uri ?? ep.auth.pickup, body, {
          headers: {
            Authorization: token,
            Telegram: options?.tgToken
          }
        })
        if (insist.stoped) {
          return undefined
        }
        if (result.status === WEB_STATUS_OK) {
          insist.proceed = false
          if (insist.callback != null) {
            void insist.callback(result.data, token)
          }
          return result.data
        } else if (!result.status.toString().startsWith('2')) {
          throw new ConnectionError('server.unreacheable')
        }
        if (insist.proceed) {
          void await new Promise(resolve => setTimeout(resolve, context.config.apiPickUpDelay))
        }
      } while (insist.proceed)

      return undefined
    },

    helloSecured: async () => {
      if (_clinet.authToken === undefined) {
        return false
      }

      const result = await url.get<{ status: string }>('/hello-secured')

      return result.status === WEB_STATUS_OK && result.data.status === 'OK'
    },

    config: {
      proofspace: async () => {
        if (cache.config.proofsapce == null) {
          const result = await url.get<ProofspaceConfig>(ep.config.proofspace)
          if (result.status !== WEB_STATUS_OK) {
            throw new ConnectionError('connection.proofspace.config')
          }
          cache.config.proofsapce = result.data
        }

        return cache.config.proofsapce
      }
    },

    integration: {
      authenticate: async (params, name) => {
        context.assertAuthentication('integration.authenticated.only')

        const result = await url.post<Member>(`${ep.integration.toId}${params.serviceId}`, integrationParamsToEntities(params, name))

        if (result.status === WEB_STATUS_UNAUTHORIZED) {
          throw new IntegrationUnauthorizedError()
        } else if (result.status !== WEB_STATUS_OK) {
          return undefined
        }

        await context.integration?.authenticate(result.data)

        return result.data
      }
    },

    polls: {
      create: async poll => {
        const result = await url.post<Poll>(`${ep.polls.list}`, {
          ...poll,
          serviceId: context.integration?.params.serviceId,
          orgId: context.integration?.params.authorization.orgId,
          managerId: context.integration?.params.authorization.userId
        })

        if (result.status === WEB_STATUS_UNAUTHORIZED) {
          throw new IntegrationUnauthorizedError()
        } else if (result.status !== WEB_STATUS_OK) {
          return
        }

        return result.data
      },

      delete: async poll => {
        const result = await url.delete(`${ep.polls.entity}${poll._id}`)
        if (result.status === WEB_STATUS_UNAUTHORIZED) {
          throw new IntegrationUnauthorizedError()
        } else if (result.status !== WEB_STATUS_OK) {
          return false
        }

        return true
      },

      load: async (id, manager) => {
        const result = await url.get<PollInfo>(`${ep.polls.entity}${id}`, {
          params: manager ? { manager: 'true' } : {}
        })
        if (result.status === WEB_STATUS_UNAUTHORIZED) {
          throw new IntegrationUnauthorizedError()
        } else if (result.status !== WEB_STATUS_OK) {
          return
        }

        return result.data
      },

      update: async (poll, id) => {
        const result = await url.patch<PollInfo>(`${ep.polls.entity}${id ?? poll._id ?? ''}`, poll)
        if (result.status === WEB_STATUS_UNAUTHORIZED) {
          throw new IntegrationUnauthorizedError()
        } else if (result.status !== WEB_STATUS_OK) {
          return
        }

        return result.data
      },

      list: async (pager, strategy) => {
        let uri = `${ep.polls.entity}`
        if (context.integration?.params.serviceId != null) {
          uri = `${uri}${context.integration.params.serviceId}`
          if (context.integration.params.authorization.orgId != null) {
            uri = `${uri}/${context.integration.params.authorization.orgId}`
          }
        }
        const result = await url.get<Listed<Poll>>(uri, {
          params: { ...pager, ...(strategy == null ? {} : { strategy }) }
        })
        if (result.status !== WEB_STATUS_OK) {
          return
        }

        return result.data
      },

      listAll: async (pager, strategy) => {
        const uri = `${ep.polls.entity}`

        const result = await url.get<Listed<Poll>>(uri, {
          params: { ...pager, ...(strategy == null ? {} : { strategy }) }
        })
        if (result.status !== WEB_STATUS_OK) {
          return
        }

        return result.data
      }
    },

    orgs: {
      load: async (service, id) => {
        const uri = `${ep.orgs.entity}${service}/${id}`
        const result = await url.get<Organization>(uri)

        if (result.status !== WEB_STATUS_OK) {
          return
        }

        return result.data
      }
    },

    census: {
      register: async id => {
        const result = await url.post<Record<string, string | undefined>>(`${ep.census.poll}${id}`, {})
        if (result.status !== WEB_STATUS_OK) {
          return
        }

        return result.data
      },

      check: async (id, address) => {
        const result = await url.get<Record<string, string | undefined>>(`${ep.census.poll}${id}`, {
          ...(address == null ? {} : { params: { address } })
        })
        if (result.status === WEB_STATUS_NO_CONTENT) {
          return undefined
        } else if (result.status === WEB_STATUS_OK) {
          return result.data
        } else {
          throw new ConnectionError()
        }
      }
    },

    telegram: {
      auth: async token => {
        const result = await url.post<{ token: string }>(ep.telegram.auth, { token })
        if (result.status === WEB_STATUS_OK) {
          return result.data
        }

        return {}
      },

      authPin: async pin => {
        const result = await url.post<{ token: string }>(ep.telegram.auth, { pin })
        if (result.status === WEB_STATUS_OK) {
          return result.data
        }

        return {}
      },

      authPoll: async (token, poll) => {
        const result = await url.post<{ token: string, error?: string }>(ep.telegram.authPoll, { token, poll })
        if (result.status === WEB_STATUS_OK) {
          return result.data.token
        } else if (result.status === 403) {
          if (result.data.error?.endsWith('deduplication.failed')) {
            throw new DuplicationError()
          }
        }
        return undefined
      },
    }
  }

  return _clinet
}
