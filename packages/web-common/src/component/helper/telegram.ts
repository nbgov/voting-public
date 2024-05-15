import { useEffect, useMemo } from 'react'
import { useCtx } from '../../context'
import { buildTelegramHelper } from '../../model/telegram'
import { TelegramHelper } from './types'

export const useTgAuthentication = (): TelegramHelper => {
  const context = useCtx()
  const helper = useMemo(() => buildTelegramHelper(context), [])
  useEffect(() => { void helper.assertAuthentication() }, [helper.getTokenFromUrl()])

  return helper
}
