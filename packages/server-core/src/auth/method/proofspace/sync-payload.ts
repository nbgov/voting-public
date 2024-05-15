import { type User, castKeystoreFromPs, castRegistrationFromPs, keystoreType, makeProofspaceNow } from '@smartapps-poll/common'
import { DEFAULT_PROOFSPACE_NAME, type PsLegayProcessPayload, type ProofspaceAuthenticationMethod } from './types'
import { type UserResource } from '../../../resources/user'
import { type AuthResource } from '../../../resources/auth'
import { makeUserModel } from '../../../model/user'
import { AUTH_PICKUP_KEY } from '../types'

/**
 * @derpecated - we are trying to remove sync strategy from the formula.
 * Cause it uses as is auth tokens in QR codes, which is unsafe.
 */
export const processPsPayload: PsLegayProcessPayload = async (ctx, {
  request, authCred, keystoreCred, auth, done
}) => {
  const userRes = ctx.db.resource<UserResource>('user')
  const authRes = ctx.db.resource<AuthResource<ProofspaceAuthenticationMethod>>('auth')

  if (authCred != null) {
    if (authCred.revoked) {
      done(new Error('auth.revoked'))
    } else if (keystoreCred?.revoked !== undefined && keystoreCred.revoked) {
      done(new Error('keystore.revoked'))
    } else if (keystoreCred !== undefined) { // Authentication
      // console.log('try to authenticate')
      const authSubject = castRegistrationFromPs(authCred)
      const keystoreSubject = castKeystoreFromPs(keystoreCred)
      let user: User
      if (auth?.user[0] !== undefined) {
        user = auth.user[0]
        await authRes.service.createToken(user, authSubject.token)
        user = await userRes.put({ ...auth.user[0], votingAddress: keystoreSubject.address })
        auth = { ...auth, user: [user] }
      } else { // Create a user if necessary
        user = await userRes.service.createWithTmpToken({
          name: DEFAULT_PROOFSPACE_NAME, token: authSubject.token, votingAddress: keystoreSubject.address
        })
        await authRes.service.createProofspaceAuth(user, request.subscriberConnectDid)
      }
      const utils = makeUserModel(ctx, user)
      await utils.storeForUser(AUTH_PICKUP_KEY, keystoreSubject.store, 300)
      done(null, { ...user, _payload: {} })
    } else { // Registration
      // console.log('try to register')
      const authSubject = castRegistrationFromPs(authCred)
      let user: User
      if (auth?.user[0] != null) { // Update user if necerssary
        user = await userRes.put({ ...auth.user[0], votingAddress: authSubject.address })
        await authRes.service.createToken(user, authSubject.token)
      } else {
        user = await userRes.service.createWithTmpToken({
          name: DEFAULT_PROOFSPACE_NAME, token: authSubject.token, votingAddress: authSubject.address
        })
        await authRes.service.createProofspaceAuth(user, request.subscriberConnectDid)
      }

      done(null, {
        ...user,
        _payload: {
          issuedCredentials: [{
            ...ctx.config.proofspace.keystoreCred,
            fields: [
              { name: keystoreType.store, value: authSubject.store },
              { name: keystoreType.address, value: authSubject.address },
              { name: keystoreType.issuedAt, value: `${makeProofspaceNow()}` }
            ],
            utcIssuedAt: new Date().getTime(),
            revoked: false
          }]
        }
      })
    }
  } else {
    done(new Error('auth.missed'))
  }
}
