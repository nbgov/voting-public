import type { Context } from '../../types'
import type { Strategy } from 'passport-strategy'
import { type PsHookRequest, /* castRegistrationFromPs, */ findPsCred } from '@smartapps-poll/common'
import type { ProofspaceAuthenticationMethod } from './proofspace/types'
import type { AuthResource } from '../../resources/auth'

import { PsSigStrategy } from './proofspace/sig-strategy'
import { AUTH_TYPE_PS } from './proofspace/types'
// import { processPsPayload } from './proofspace/sync-payload'
// import { SALTED_AUTH_TYPE } from './token'
import { buildPsPayloadProcessHandler } from './proofspace/async-payload'

export const createStrategy = (context: Context): Strategy => {
  const ps = context.config.proofspace
  /**
   * @queue ✅
   * @frequent ✅
   */
  return new PsSigStrategy(async (req, done) => {
    try {
      const request: PsHookRequest = req.body
      const authRes = context.db.resource<AuthResource<ProofspaceAuthenticationMethod>>('auth')

      const auth = await authRes.service.authenticateWithHash(AUTH_TYPE_PS, request.subscriberConnectDid)

      const authCred = findPsCred(request.receivedCredentials, context.config.proofspace.authCred) ??
        findPsCred(request.receivedCredentials, context.config.proofspace.regCred)

      const keystoreCred = findPsCred(request.receivedCredentials, context.config.proofspace.keystoreCred)

      // console.log('Incoming', authCred && castRegistrationFromPs(authCred))

      // if (authCred == null || !castRegistrationFromPs(authCred).token.startsWith(SALTED_AUTH_TYPE + ':')) {
      //   await processPsPayload(context, { request, authCred, keystoreCred, auth: auth ?? undefined, done })
      // } else {

      // console.log(authCred, keystoreCred, auth)

      const result = await buildPsPayloadProcessHandler(req.context).wait(
        { request, auth: auth ?? undefined, authCred, keystoreCred }
      )
      done(null, result)
      // }
    } catch (e) {
      done(e as Error)
    }
  }, {
    pubKeySource: `${ps.dashboardBackendUrl}/service/{service}/public-info/public-key/{pubkey}`,
    defaultKeyName: ps.pubKeyId,
    defaultServiceId: ps.serviceId
  })
}

export const AUTH_PS_SIG = 'ps-sig'
