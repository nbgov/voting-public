import { patchI18n, useCtx } from '@smartapps-poll/web-common'
import { type FunctionComponent, type PropsWithChildren, useEffect, useState } from 'react'
import { type Context } from '../shared'
import { Main } from './main'
import { useTranslation } from 'react-i18next'
import { belarusManagerTranslation, englishManagerTranslation, russianManagerTranslation } from '../i18n'

export const DebugMain: FunctionComponent<PropsWithChildren> = ({ children }) => {
  const ctx = useCtx<Context>()
  const [state, update] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => {
      if (ctx.isRoleAuthenticated()) {
        update(state + 1)
        clearInterval(timer)
      }
    }, 1000)

    return () => { clearInterval(timer) }
  }, [])
  const { i18n } = useTranslation()
  patchI18n(i18n, {
    en: { translation: englishManagerTranslation },
    be: { translation: belarusManagerTranslation },
    ru: { translation: russianManagerTranslation }
  })

  return ctx.isRoleAuthenticated()
    ? children != null
      ? <>{children}</>
      : <Main />
    : <>Please authenticate!</>
}
