import type { IntegrationParams, Listed, Member, NewPoll, Organization, Pager, Poll, PollInfo, ProofspaceConfig } from '@smartapps-poll/common'
import type { AxiosInstance } from 'axios'
import type { ParsedUrl } from 'parse-url'

export interface WebClient {
  authToken?: string

  currentUrl: () => ParsedUrl

  client: () => AxiosInstance

  authenticated: (token: string) => void

  unauthenticate: () => void

  authenticateToken: (token?: string) => Promise<string | true>

  authenticateAndPickUp: <T = string>(insist: Insist<T>, token?: string, options?: AuthPickUpOptions) =>
    Promise<AuthPickup<T> | undefined>

  authenticateAndPickUpPost: <T = string>(insist: Insist<T>, body: Record<string, unknown>, token?: string, options?: AuthPickUpOptions) =>
    Promise<AuthPickup<T> | undefined>

  helloSecured: () => Promise<boolean>

  config: {
    proofspace: () => Promise<ProofspaceConfig>
  }

  integration: {
    authenticate: (params: IntegrationParams, name?: string) => Promise<Member | undefined>
  }

  polls: {
    create: (poll: NewPoll) => Promise<Poll | undefined>
    delete: (poll: NewPoll) => Promise<boolean>
    load: (id: string, manager?: boolean) => Promise<PollInfo | undefined>
    update: (poll: Partial<Poll>, id?: string) => Promise<PollInfo | undefined>
    list: (pager: Pager, strategy?: string) => Promise<Listed<Poll> | undefined>
    listAll: (pager: Pager, strategy?: string) => Promise<Listed<Poll> | undefined>
  }

  orgs: {
    load: (serviceId: string, id: string) => Promise<Organization | undefined>
  }

  census: {
    register: (id: string) => Promise<Record<string, string | undefined> | undefined>
    check: (id: string, address?: string) => Promise<Record<string, string | undefined> | undefined>
  }

  telegram: {
    auth: (token: string) => Promise<TelegramAuthResponse>
    authPin: (pin: string) => Promise<TelegramAuthResponse>
    authPoll: (token: string, pollId: string) => Promise<string | undefined>
  }
}

export interface TelegramAuthResponse {
  token?: string
  golos?: boolean
}

export interface Insist<T = unknown> {
  proceed: boolean
  stoped: boolean
  exit: () => void
  cancel: () => void
  stop: () => void
  revive: () => void
  callback?: InsistCallback<T>
}

export type InsistCallback<T = unknown> = (pickup: AuthPickup<T>, token?: string) => Promise<void>

export interface AuthPickup<T = unknown> {
  pickup: T
}

export interface AuthPickUpOptions {
  uri?: string
  tgToken?: string
}
