import { type FunctionComponent, type PropsWithChildren, Suspense } from 'react'
import type { CommonContext } from './types'

import { WebContext } from './model'
import { LocalizedError, type IntegrationParams } from '@smartapps-poll/common'
import { buildIntegration } from '../integration'
import type { i18n as I18n } from 'i18next'
import { I18nextProvider } from 'react-i18next'
import { initI18nWeb } from './i18n'
import { MainModal } from '../component/utils/modal'

export const WebContextProvider: FunctionComponent<PropsWithChildren<WebContextProviderProps>> = (
  { context, i18n, integration, children }
) => {
  i18n = i18n ?? initI18nWeb({}, context.config)
  context.i18n = i18n
  LocalizedError.translator = (key, params) => (i18n as I18n).t(`error.${key}`, { ...params })
  context.integration = integration != null ? buildIntegration(integration) : undefined
  return <WebContext.Provider value={context}>
    <I18nextProvider i18n={i18n}><Suspense fallback="loading...">{children}</Suspense></I18nextProvider>
    <MainModal />
  </WebContext.Provider>
}

export interface WebContextProviderProps {
  context: CommonContext
  i18n?: I18n
  integration?: IntegrationParams
}
