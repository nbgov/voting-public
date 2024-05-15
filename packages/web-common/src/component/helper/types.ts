import type { PollInfo } from '@smartapps-poll/common'

export interface TelegramHelper {
  token?: string

  hasGolos?: boolean

  oneTimeWebToken?: string

  isTokenPresented: () => boolean

  getTokenFromUrl: () => string

  authenticate: () => Promise<boolean>

  authenticatePin: (pin: string) => Promise<boolean>

  isAuthenticated: () => Promise<boolean>

  assertAuthentication: () => Promise<boolean>

  assertPollBlocker: (poll: PollInfo) => Promise<boolean>

  mayBeUsedInstead: (poll: PollInfo) => Promise<boolean>

  pickOneTimeWebToken: (poll: PollInfo) => Promise<string | undefined>

  assertPollAuthorization: (poll: PollInfo, noCancel?: boolean) => Promise<boolean>
}
