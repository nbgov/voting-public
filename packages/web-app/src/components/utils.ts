import { useCtx } from '@smartapps-poll/web-widget/dist/app'
import { NEWBELARUS_STRATEGY, PROOFSPACE_STRATEGY } from '@smartapps-poll/common'
import { applyRetrier, buildAnalytics, createNBWrapperWalletStrategy, makeFireproxyAdapter, updateContextStrategy } from '@smartapps-poll/web-common'
import { useLocation, useSearchParams } from 'react-router-dom'
import { useEffect } from 'react'
import axios from 'axios'

let _axiosReconfigured: boolean = false
export const useAppContextStrategyUpdate = (path?: string): string => {
  const ctx = useCtx()
  const [searchParams] = useSearchParams()
  const strategy = searchParams.get('_credsStrategy')
  if (strategy === NEWBELARUS_STRATEGY) {
    updateContextStrategy(ctx, { creds: createNBWrapperWalletStrategy })
  }
  const location = useLocation()
  const analytics = buildAnalytics(ctx)
  const _path = path ?? location.pathname +
    // (location.search !== '' ? '?' + location.search : '') +
    (location.hash !== '' ? '#' + location.hash : '')
  const webView = useViewWithWrappedLayout()
  useEffect(() => {
    analytics.setupUser({ webView, domain: ctx.web.currentUrl().host })
    analytics.logScreen(_path)
  }, [_path])

  if (!_axiosReconfigured) {
    _axiosReconfigured = true
    applyRetrier(axios)
    const config = ctx.getApiConfiguration()
    if (config.vocdoni?.fireproxy != null && config.vocdoni.fireproxy) {
      axios.defaults.adapter = makeFireproxyAdapter(ctx)
    }
  }

  return strategy ?? PROOFSPACE_STRATEGY
}

export const useViewWithWrappedLayout = (): boolean => {
  const [searchParams] = useSearchParams()
  const strategy = searchParams.get('_credsStrategy')
  return [NEWBELARUS_STRATEGY].includes(strategy ?? PROOFSPACE_STRATEGY)
}
