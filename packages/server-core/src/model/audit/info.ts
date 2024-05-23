import { RENDERER_PARTY } from '@smartapps-poll/common'
import { AUDIT_WORKER, DB_WORKER, QUEUE_AUDIT } from '../../queue/consts'
import { WorkerHandlerWithCtx } from '../../queue/types'
import { makeWaitMethod, serializeError } from '../../queue/utils'
import { PollResource } from '../../resources/poll'
import { ProofResouce } from '../../resources/proof'
import { MalformedError } from '../../routes/errors'

export const buildAuditInfoHandler: WorkerHandlerWithCtx<AuditInfoParams, AuditInfo> = ctx => ({
  tags: [DB_WORKER, AUDIT_WORKER],

  queue: QUEUE_AUDIT,

  name: 'audit:info',

  handler: async job => {
    try {
      const id = job.data.id
      if (id == null) {
        throw new MalformedError('request.poll')
      }
      const pollRes: PollResource = ctx.db.resource('poll')
      const poll = await pollRes.get(id, '_id')
      if (poll == null) {
        throw new MalformedError('request.poll')
      }

      const proofRes: ProofResouce = ctx.db.resource('proof')
      const docsAuthorizd = await proofRes.service.auditProof(poll)

      const election = await ctx.strategy.service().poll.info(poll)
      const results: AuditResult[] = []

      if (poll.uiType === RENDERER_PARTY) {
        const _question = election?.questions != null ? election?.questions[0] : undefined
        poll.questions?.forEach((question, index) => {
          if (_question?.choices[index] != null && question != null) {
            const choice = _question.choices[index]
            if (choice != null) {
              results.push({ title: question.title ?? index.toString(), share: choice.share, count: choice.count })
            }
          }
        })
      } else {
        poll.questions?.forEach((question, index) => {
          question?.choices?.forEach((_choice, idx) => {
            const choice = election?.questions[index]?.choices[idx]
            if (choice != null && question != null && _choice != null) {
              results.push({
                title: `${question.title ?? index.toString()} - ${_choice.title ?? idx.toString()}`,
                share: choice.share, count: choice.count
              })
            }
          })
        })
      }

      return {
        code: poll.code ?? poll.title,
        startTime: poll.startDate.toString(),
        finishTime: poll.endDate.toString(),
        status: poll.status,
        blockchainStatus: election.status ?? 'UPCOMING',
        authorized: Object.entries(docsAuthorizd).reduce((memo, [, count]) => memo + count, 0),
        count: election.voteCount ?? 0,
        size: election.maxCensusSize ?? election?.census?.size ?? poll?.census?.size ?? 0,
        results
      }
    } catch (e) {
      serializeError(e)
      throw e
    }
  },

  wait: makeWaitMethod(ctx, QUEUE_AUDIT, 'audit:info')
})

export interface AuditInfo {
  code: string
  startTime: string
  finishTime: string
  status: string
  blockchainStatus: string
  authorized: number
  count: number
  size: number
  results: AuditResult[]
}

export interface AuditResult {
  title: string
  share: number
  count: number
}

export interface AuditInfoParams {
  id: string
}
