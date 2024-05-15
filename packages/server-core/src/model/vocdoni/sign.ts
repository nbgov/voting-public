import { DB_WORKER, QUEUE_DB_SYNC } from '../../queue/consts'
import type { WorkerHandlerWithCtx } from '../../queue/types'
import type { VocdoniSignData, VocdoniStepResult } from './types'
import { makeWaitMethod, serializeError } from '../../queue/utils'
import { AUTH_TYPE_TOKEN_ONETIME, CensusStatus, PollError, PollReadyError, PollStatus, TmpTokenAuthenticationMethod, VOCDONI_CENSUS_CSP_BLINDNS, getWalletUtils } from '@smartapps-poll/common'
import { PollResource } from '../../resources/poll'
import { AuthResource } from '../../resources/auth'
import { buildDbSecurityHelper } from '../../db/security'
import { blindSign } from 'blindsecp256k1'
import BigInteger from 'bigi'
import { strip0x } from '@vocdoni/sdk'
import { MalformedError } from '../../routes/errors'

export const buildVocdoniSignHandler: WorkerHandlerWithCtx<VocdoniSignData, VocdoniStepResult> = ctx => ({
  tags: [DB_WORKER],

  queue: QUEUE_DB_SYNC,

  name: 'vocdoni:csp-sign',

  handler: async job => {
    try {
      const { votingId, user, authType, token, payload } = job.data
      const Wallet = getWalletUtils()

      const pollRes: PollResource = ctx.db.resource('poll')

      const poll = await pollRes.get(votingId, 'externalId')
      if (poll == null) {
        throw new PollError('poll.notexists')
      }
      if (poll.status !== PollStatus.STARTED) {
        throw new PollReadyError()
      }
      if (poll.census.status !== CensusStatus.PUBLISHED) {
        throw new PollReadyError('census.notpublished')
      }
      if (user?._id == null) {
        throw new PollError('auth.required')
      }

      if (authType === 'blind') {
        const authRes: AuthResource = ctx.db.resource('auth')
        const auth = await authRes.service.authenticateWithHash(AUTH_TYPE_TOKEN_ONETIME, token) as TmpTokenAuthenticationMethod
        // Actually this method is called just for legacy consistancy when ontime token were stored in the database
        authRes.service.cleanTmpToken(token)

        if (auth == null || auth.credentials == null) {
          throw new PollError('auth.insecure')
        }

        if (poll.census.type !== VOCDONI_CENSUS_CSP_BLINDNS) {
          throw new PollError('poll.wrongtype')
        }
        if (poll.census.token == null) {
          throw new PollReadyError()
        }

        // let token = poll.census.token
        const skHelper = buildDbSecurityHelper(ctx)
        const _token = (await skHelper.decryptSecretKey(poll.census.token)).toString('utf8')

        const serverWallet = await Wallet.fromEncryptedJson(_token, ctx.config.salt)

        const hexSig = blindSign(
          BigInteger.fromHex(strip0x(serverWallet.privateKey)),
          BigInteger.fromHex(payload),
          BigInteger.fromHex(auth.credentials.k)
        ).toHex(32)

        return { signature: hexSig }
      }
      throw new MalformedError()
    } catch (e) {
      serializeError(e)
      throw e
    }
  },

  wait: makeWaitMethod(ctx, QUEUE_DB_SYNC, 'vocdoni:csp-sign')
})
