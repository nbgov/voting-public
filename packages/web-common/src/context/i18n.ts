import i18n from 'i18next'
import type { Resource, i18n as I18n, InitOptions } from 'i18next'
import detector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import { belarusCommonTranslation, belarusNewBelarus, englishCommonTranslation, englishNewBelarus, russianCommonTranslation, russianNewBelarus } from '../i18n'
import { type CommonConfig } from './types'
import { NEWBELARUS_STRATEGY } from '@smartapps-poll/common'

export const initI18nWeb = (options: InitOptions, config: CommonConfig): I18n => {
  const i18next = i18n.createInstance({
    debug: config.debug?.i18n != null ? config.debug?.i18n : false,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    ...options,
    resources: {
      be: { translation: belarusCommonTranslation },
      en: { translation: englishCommonTranslation },
      ru: { translation: russianCommonTranslation }
    }
  })

  i18next.use(detector).use(initReactI18next)

  void i18next.init()

  patchI18n(i18next, {
    be: { [NEWBELARUS_STRATEGY]: belarusNewBelarus },
    en: { [NEWBELARUS_STRATEGY]: englishNewBelarus },
    ru: { [NEWBELARUS_STRATEGY]: russianNewBelarus }
  })

  if (options.resources != null) {
    patchI18n(i18next, options.resources)
  }

  return i18next
}

export const patchI18n = (i18n: I18n, resources: Resource): void => {
  Object.entries(resources).forEach(
    ([lng, bundle]) => {
      Object.entries(bundle).forEach(
        ([ns, resource]) => i18n.addResourceBundle(lng, ns, resource, true, true)
      )
    }
  )
}
