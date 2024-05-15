import { initI18nWeb, patchI18n } from '@smartapps-poll/web-common'
import type { InitOptions, i18n as I18n } from 'i18next'
import { type Config } from './types'
import { belarusSharedTranslation, englishSharedTranslation, russianSharedTranslation } from '../i18n'
import duration from 'dayjs/plugin/duration'
import relative from 'dayjs/plugin/relativeTime'
import days from 'dayjs'
import 'dayjs/locale/en'
import 'dayjs/locale/ru'
import 'dayjs/locale/be'

days.extend(duration)
days.extend(relative)

export const initI18nShared = (options: InitOptions, config: Config): I18n => {
  const locale = navigator.languages != null && (navigator.languages.length > 0)
    ? navigator.languages[0]
    : navigator.language

  switch (true) {
    case locale.startsWith('ru'):
      days.locale('ru')
      break
    case locale.startsWith('be'):
      days.locale('be')
      break
    default:
      days.locale('en')
      break
  }

  const i18next = initI18nWeb({
    ...options,
    resources: {
      en: { translation: englishSharedTranslation },
      be: { translation: belarusSharedTranslation },
      ru: { translation: russianSharedTranslation }
    }
  }, config)

  if (options.resources != null) {
    patchI18n(i18next, options.resources)
  }

  return i18next
}
