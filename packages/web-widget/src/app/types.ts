import type { CommonContext, CommonConfig, PartialCommonContext } from '@smartapps-poll/web-common'

export interface Context extends CommonContext<Config> {
}

export interface PartialContext extends PartialCommonContext { }

export interface Config extends CommonConfig {
  debug?: {
    auth?: string
    i18n?: boolean
  }
  baseUrl?: string
}
