import type { MemberRole } from '@smartapps-poll/common'
import type { CommonContext, CommonConfig, PartialCommonContext } from '@smartapps-poll/web-common'

export interface Context extends CommonContext<Config> {
  isRoleAuthenticated: (role?: MemberRole) => boolean
}

export interface PartialContext extends PartialCommonContext { }

export interface Config extends CommonConfig {
  debug?: {
    auth?: string
    i18n?: boolean
  }
  sharableBaseUrl?: string
  role?: MemberRole
}
