import { TFunction } from 'i18next'

export const setError = (t: TFunction, code: number | string, text?: string) => {
  document.title = `:error:${code}:${t(text ?? 'error.unknown', { ns: 'translation' })}`
}
