import {
  type User, castKeystoreFromPs, castRegistrationFromPs, castAuthFromPs, buildAnonymousUser, isPsRequestProper,
  PROOFSPACE_STRATEGY, type TgUser
} from '@smartapps-poll/common'
import {
  DEFAULT_PROOFSPACE_NAME, TERMINATION_PAYLOAD, type ProofspaceAuthenticationMethod, type PsProcessPayload,
  type UserWithPayload, type PsProcessPayloadParams
} from './types'
import { type UserResource } from '../../../resources/user'
import { type AuthResource } from '../../../resources/auth'
import { makeUserModel } from '../../../model/user'
import { AUTH_PICKUP_KEY, REG_PICKUP_KEY } from '../types'
import { type ProofResouce } from '../../../resources/proof'
import { filterProofs } from '../../../model/proof'
import { buildProofService } from '../../../model/proof/service'
import { buildStoreHelper } from '../../../model/redis'
import { issueTgCredForProofspace } from '../../../model/proofspace/telegram'
import type { WorkerHandlerWithCtx } from '../../../queue/types'
import { DB_WORKER, QUEUE_DB_SYNC } from '../../../queue/consts'
import { makeWaitMethod, serializeError } from '../../../queue/utils'
import { AuditOutcome, AuditStage } from '../../../model/audit/types'

export const processPsPayloadAsync: PsProcessPayload = async (ctx, { request, authCred, keystoreCred, auth }) => {
  const userRes = ctx.db.resource<UserResource>('user')
  const authRes = ctx.db.resource<AuthResource<ProofspaceAuthenticationMethod>>('auth')
  if (authCred != null) {
    let user: User = {} as User

    if (authCred.revoked) {
      throw new Error('auth.revoked')
    } else if (keystoreCred?.revoked !== undefined && keystoreCred.revoked) {
      throw new Error('keystore.revoked')
    } else if (keystoreCred !== undefined) { // Authentication
      ctx.auditLogger.proofspace(request.subscriberConnectDid, 'authentication', AuditOutcome.UNKNOWN, AuditStage.INITIALIZATION)
      // console.log('try to authenticate')
      const authSubject = castRegistrationFromPs(authCred)
      const keystoreSubject = castKeystoreFromPs(keystoreCred)

      if (auth?.user[0] !== undefined) {
        // console.log('salt token for existing user')
        user = auth.user[0]
        await authRes.service.createSaltedToken(user, authSubject.token)
        user = await userRes.put({ ...auth.user[0], votingAddress: keystoreSubject.address })
        auth = { ...auth, user: [user] }
      } else { // Create a user if necessary
        // console.log('create user on auth')
        user = await userRes.service.createWithSaltedToken({
          name: DEFAULT_PROOFSPACE_NAME, token: authSubject.token, votingAddress: keystoreSubject.address
        })
        await authRes.service.createProofspaceAuth(user, request.subscriberConnectDid)
      }

      const proofRes = ctx.db.resource<ProofResouce>('proof')
      await Promise.all(filterProofs(ctx, request.receivedCredentials).map(
        async cred => {
          // console.log(`We are adding cred: ${cred.credentialId}`)
          const proof = await proofRes.service.load(user._id, PROOFSPACE_STRATEGY, cred.credentialId)
          if (proof == null) {
            await proofRes.put({ userId: user._id, source: PROOFSPACE_STRATEGY, id: cred.credentialId })
          }
        }
      ))

      const utils = makeUserModel(ctx, user)
      await utils.storeForUser(AUTH_PICKUP_KEY, keystoreSubject.store, 300)

      ctx.auditLogger.proofspace(request.subscriberConnectDid, 'authentication', true)
    } else if (isPsRequestProper(request, ctx.config.proofspace.regCred.interaction ?? '')) { // Registration
      ctx.auditLogger.proofspace(request.subscriberConnectDid, 'registration', AuditOutcome.UNKNOWN, AuditStage.INITIALIZATION)
      // console.log('try to register')
      const authSubject = castRegistrationFromPs(authCred)
      if (auth?.user[0] != null) { // Update user if necerssary
        // console.log('update user - no user')
        user = await userRes.put({ ...auth.user[0], votingAddress: authSubject.address })
        await authRes.service.createSaltedToken(user, authSubject.token)
      } else {
        // console.log('create user with salt')
        user = await userRes.service.createWithSaltedToken({
          name: DEFAULT_PROOFSPACE_NAME, token: authSubject.token, votingAddress: authSubject.address
        })
        await authRes.service.createProofspaceAuth(user, request.subscriberConnectDid)
      }
      const utils = makeUserModel(ctx, user)
      await utils.storeForUser(REG_PICKUP_KEY, JSON.stringify(request), 300)
      ctx.auditLogger.proofspace(request.subscriberConnectDid, 'registration', true)
    } else if (keystoreCred === undefined) {
      ctx.auditLogger.proofspace(request.subscriberConnectDid, 'authorization', AuditOutcome.UNKNOWN, AuditStage.INITIALIZATION)
      // console.log('we authorize anonymously')
      const authSubject = castAuthFromPs(authCred)
      // @TODO poll id is required here to properly verify the provided creds
      if (authSubject.resource == null) {
        throw new Error('authroization.resource.required')
      }

      const authObj = await authRes.service.createTmpSaltedToken(authSubject.token, false)
      user = buildAnonymousUser(authObj.id)
      auth = { ...authObj, user: [user] }
      const utils = makeUserModel(ctx, user)

      const store = buildStoreHelper(ctx)

      const [, token] = authSubject.token.includes(':') ? authSubject.token.split(':', 2) : [, null]
      const tg: { tg: string } | undefined = token == null ? undefined : await store.get('tg:' + token)
      const tgUser: TgUser | undefined = tg == null ? undefined : await store.get('tg-user:' + tg.tg)

      if (!await buildProofService(ctx).authorizePsResource(authSubject.resource, request.receivedCredentials, { tgUser })) {
        await utils.storeForUser(AUTH_PICKUP_KEY, TERMINATION_PAYLOAD, 300)
        // console.log('deduplication begins')
        ctx.auditLogger.proofspace(request.subscriberConnectDid, 'deduplication', AuditOutcome.ABUSE, AuditStage.PROGRESS)
        throw new Error('deduplication.failed')
      }

      try {
        /**
         * @TODO it will issue Tg cred every time - we need to do it once - somehow?
         * But it probably isn't a problem, cause tg creads are volatile.
         */
        if (tgUser != null) {
          console.log('try to issue tg cred')
          await issueTgCredForProofspace(ctx, request, tgUser)
        }
      } catch (_e) {
        ctx.auditLogger.proofspace(request.subscriberConnectDid, 'authorization', AuditOutcome.ERROR, AuditStage.PROGRESS)
        console.error('issuing tg cred failed')
      }

      await utils.storeForUser(AUTH_PICKUP_KEY, authSubject.resource ?? 'unknown', 300)
      ctx.auditLogger.proofspace(request.subscriberConnectDid, 'authorization', true)
    }
    /**
     * @TODO It can not work well in the context of job cause usually it was exiting with done in a particular place
     */
    // We send empty payload expecting async creation of store cred
    return { ...user, _payload: {} }
  }

  throw new Error('auth.missed')
}

export const buildPsPayloadProcessHandler: WorkerHandlerWithCtx<PsProcessPayloadParams, UserWithPayload> = ctx => ({
  tags: [DB_WORKER],
  queue: QUEUE_DB_SYNC,
  name: 'proofspace:process-payload',
  handler: async job => {
    try {
      return await processPsPayloadAsync(ctx, job.data)
    } catch (e) {
      ctx.auditLogger.proofspace(job.data.request.subscriberConnectDid, 'handler', AuditOutcome.ERROR)
      serializeError(e)
      throw e
    }
  },

  wait: makeWaitMethod(ctx, QUEUE_DB_SYNC, 'proofspace:process-payload')
})
