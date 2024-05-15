import type { PsHookResponse, User } from '@smartapps-poll/common'
import type { AllResponsesToPs, UserWithPayload } from './types'
import { createSign } from 'crypto'
import { type Context } from '../../../types'
import axios from 'axios'
import { ProofspaceError } from '../../../model/errors'
import type { WorkerHandlerWithCtx } from '../../../queue/types'
import { QUEUE_REMOTE_SYNC, REMOTE_WORKER } from '../../../queue/consts'
import { makeWaitMethod, serializeError } from '../../../queue/utils'

export const castPaylod = (user: User | UserWithPayload): PsHookResponse | undefined =>
  '_payload' in user ? user._payload as PsHookResponse : undefined

export const sendToProofspace = async (ctx: Context, response: AllResponsesToPs): Promise<void> => {
  const ps = ctx.config.proofspace
  const url = `${ps.dashboardBackendUrl}/service/${ps.serviceId}/webhook-accept/credentials-issued/`

  const headers = { 'Content-Type': 'application/json', 'X-Body-Signature': '' }

  const signer = createSign('sha3-256')
  const payload = Buffer.from(JSON.stringify(response), 'utf-8')
  signer.update(payload)
  headers['X-Body-Signature'] = signer.sign(ps.pk ?? '', 'base64')

  const result = await axios.post<{ ok: boolean, error?: { message: string } }>(
    url, payload, { headers, validateStatus: () => true }
  )
  if (!result.data.ok) {
    console.error(result.data.error?.message ?? result.data.error ?? result.data)
    throw new ProofspaceError(result.data.error?.message)
  }
}

export const buildSendToPsHandler: WorkerHandlerWithCtx<AllResponsesToPs> = ctx => ({
  tags: [REMOTE_WORKER],

  queue: QUEUE_REMOTE_SYNC,

  name: 'proofspace:issue-cred',

  handler: async job => {
    try {
      await sendToProofspace(ctx, job.data)
    } catch (e) {
      serializeError(e)
    }
  },

  wait: makeWaitMethod(ctx, QUEUE_REMOTE_SYNC, 'proofspace:issue-cred')
})
