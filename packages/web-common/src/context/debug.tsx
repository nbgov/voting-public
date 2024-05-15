import type { FunctionComponent, PropsWithChildren } from 'react'
import type { CommonConfig as Config, CommonContext as Context } from './types'
import { buildCommonContext } from './model'
import { DebugLauout } from '../component'
import { WebContextProvider } from './provider'
import type { i18n as I18n } from 'i18next'

export const buildDebugContext = (config: Config): Context => buildCommonContext(config)

export const DebugContextProvider: FunctionComponent<PropsWithChildren<{
  config: Config
  i18n?: I18n
}>> = ({ i18n, config, children }) =>
    <WebContextProvider context={buildDebugContext(config)} i18n={i18n}>
      <DebugLauout>{children}</DebugLauout>
    </WebContextProvider>
