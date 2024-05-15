import type { CommonContext } from '../context'
import { TELEGRAM_STRATEGY, getTgMeta, isAuthroizationRequired } from '@smartapps-poll/common'
import { AuthenticationError } from '../component/auth/errors'
import { TGPIN_BACK, TGPIN_OK } from '../component/telegram/consts'
import { makeTelegramPincode } from '../component/telegram/pincode'
import { makeTelegramBlocker } from '../component/telegram/blocker'
import { TelegramHelper } from '../component/helper/types'

export const buildTelegramHelper = (ctx: CommonContext): TelegramHelper => {
  const _helper: TelegramHelper = {
    isTokenPresented: () => {
      const currentUrl = ctx.web.currentUrl()

      return "bot_token" in currentUrl.query && currentUrl.query.bot_token != null
    },

    getTokenFromUrl: () => {
      const currentUrl = ctx.web.currentUrl()

      return currentUrl.query.bot_token ?? ''
    },

    authenticate: async () => {
      if (_helper.isTokenPresented()) {
        console.info('Tg token is presented')
        const tgAuth = await ctx.web.telegram.auth(_helper.getTokenFromUrl())
        if (tgAuth.token != null) {
          _helper.token = tgAuth.token
          _helper.hasGolos = tgAuth.golos

          return true
        }
      }

      return false
    },

    authenticatePin: async pin => {
      const tgAuth = await ctx.web.telegram.authPin(pin)
      if (tgAuth.token != null) {
        _helper.token = tgAuth.token
        _helper.hasGolos = tgAuth.golos

        return true
      }

      return false
    },

    assertAuthentication: async () => {
      if (_helper.token == null) {
        return _helper.authenticate()
      }

      return true
    },

    assertPollBlocker: async (poll) => {
      const tgCred = poll.requiredProofs?.find(proof => proof.type === TELEGRAM_STRATEGY)
      if (isAuthroizationRequired(poll) && tgCred != null) {
        if (!await _helper.assertAuthentication() && tgCred.isMandatory) {
          const result = await ctx.modal.request(makeTelegramBlocker(poll))
          if (result !== TGPIN_BACK) {
            throw new AuthenticationError()
          } else {
            return false
          }
        }
      }

      return true
    },

    /**
     * @TODO Not used (cause it implies load token by pin which is not available)
     */
    assertPollAuthorization: async (poll, noCancel) => {
      if (isAuthroizationRequired(poll) && poll.requiredProofs?.some(proof => proof.type === TELEGRAM_STRATEGY)) {
        const mandatory = poll.requiredProofs.find(proof => proof.type === TELEGRAM_STRATEGY && proof.isMandatory)
        if (!await _helper.assertAuthentication()) {
          const result = await ctx.modal.request(makeTelegramPincode(poll, _helper.authenticatePin, noCancel))
          if (result !== TGPIN_OK && mandatory != null) {
            throw new AuthenticationError()
          }
        }
      }

      return true
    },

    mayBeUsedInstead: async poll => {
      if (!await _helper.assertAuthentication()) {
        return false
      }

      const meta = getTgMeta(poll)
      if (meta != null && meta?.allowInstead && meta.allowAny && _helper.hasGolos) {
        return true
      }

      return false
    },

    pickOneTimeWebToken: async poll => {
      if (await _helper.mayBeUsedInstead(poll) && _helper.token != null) {
        const token = await ctx.web.telegram.authPoll(_helper.token, poll._id)
        if (token != null) {
          return ctx.web.authToken = token
        }
      }

      return undefined
    },

    isAuthenticated: async () => _helper.token != null
  }

  return _helper
}
