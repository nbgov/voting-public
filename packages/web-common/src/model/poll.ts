import { type Poll, PollError, PollStatus, getProofStrategy, isAuthroizationRequired, PROOFSPACE_STRATEGY, PsActionTemplate, isPsAuthenticationRequired, TELEGRAM_STRATEGY } from '@smartapps-poll/common'
import { type PollHelper } from './types'
import { type CommonContext } from '../context'
import { pollAuthroizationVerificators } from '../component/authorization/strategy'
import { buildTelegramHelper } from './telegram'
import { AuthenticationError } from '../component/auth/errors'

export const buildPollHelper = (ctx: CommonContext): PollHelper => {
  const _helper: PollHelper = {
    getPollStrategy: async poll => {
      if (poll == null) {
        throw new PollError('poll.no')
      }
      const config = await ctx.web.config.proofspace()
      if (![PollStatus.PUBLISHED, PollStatus.STARTED].includes(poll.status)) {
        throw new PollError('poll.registration')
      }
      const strategy = getProofStrategy(poll, ctx.strategy.creds().getType())
      if (poll.requiredProofs == null || poll.requiredProofs.length < 1 ||
        poll.requiredProofs.some(proof => proof.meta == null)) {
        throw new PollError('poll.noproof')
      }
      if (poll.requiredProofs.filter(proof => proof.type !== TELEGRAM_STRATEGY).length > 2) {
        throw new PollError('poll.multiproof.support')
      }

      pollAuthroizationVerificators[strategy](poll, config)
      return strategy
    },

    isPsAuthenticationRequired: async poll => {
      if (poll == null) {
        return false
      }
      if (isAuthroizationRequired(poll)) {
        const proofspaceAction = poll.requiredProofs?.find(
          proof => proof.type === PROOFSPACE_STRATEGY
        )?.meta as PsActionTemplate
        const config = await ctx.web.config.proofspace()

        return isPsAuthenticationRequired(proofspaceAction, config)
      }

      return false
    },

    challenge: async poll => {
      if (poll == null) {
        throw new PollError('poll.no')
      }
      return await ctx.strategy.creds().challenge(poll)
    },

    vote: async (poll, answers) => {
      if (poll == null) {
        throw new PollError('poll.no')
      }
      if (ctx.web.authToken == null) {
        if (await buildTelegramHelper(ctx).pickOneTimeWebToken(poll) == null) {
          throw new AuthenticationError('vote.unatorized')
        }
      }

      const signature = await ctx.strategy.service().poll.authorizeVote(poll)
      return await ctx.strategy.service().poll.vote(poll as Poll, answers, signature)
    }
  }

  return _helper
}
