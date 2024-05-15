import { logEvent, setUserProperties } from 'firebase/analytics'
import type { CommonContext } from '../context'
import type { AnalyticsHelper } from './types'

export const buildAnalytics = (ctx: CommonContext): AnalyticsHelper => {
  const _helper: AnalyticsHelper = {
    logScreen: screen => {
      logEvent(ctx.getAnalytics(), 'page_view', { page_path: screen })
    },

    log: (event, params) => {
      logEvent(ctx.getAnalytics(), event, params)
    },

    startVote: (poll, startegy, style) => {
      logEvent(ctx.getAnalytics(), 'start_vote', { poll, startegy, style })
    },

    finishVote: (poll, startegy, style, success) => {
      logEvent(
        ctx.getAnalytics(), 'finish_vote',
        { poll, startegy, style, success: (success === undefined ? true : success) ? 'yes' : 'no' }
      )
    },

    setupUser: params => {
      setUserProperties(ctx.getAnalytics(), {
        webView: params.webView ? 'yes' : 'no',
        domain: params.domain
      })
    }
  }

  return _helper
}
