import { type Poll, type Proof } from '@smartapps-poll/common'
import { createResourceBuilder } from '../db/resource'
import { type Resource, type ResourceServiceBuilder } from '../db/types'
import { type Context } from '../types'
import days from 'dayjs'
import { context } from '../context'
import { buildProofService } from '../model/proof/service'

export const createProofResource = (ctx: Context): Resource =>
  createResourceBuilder('proof', ctx)
    .schema({
      bsonType: 'object',
      title: 'Proof',
      required: ['userId', 'source', 'id', 'expiredAt'],
      properties: {
        _id: {
          bsonType: 'string'
        },
        userId: {
          bsonType: 'string',
          description: 'Id of the user from voting system'
        },
        source: {
          bsonType: 'string',
          description: 'Source service providing the proof'
        },
        expiredAt: {
          bsonType: 'date',
          description: 'Proof cannot be registered for long period of time, cause we don\'t know if it\'s rewoked or expired itself'
        },
        id: {
          bsonType: 'string',
          description: 'If of the proof (or another code) from the service'
        }
      }
    }).index('proofId', { source: 1, id: 1 })
    .index('userId', { userId: 1 })
    .index('presence', { userId: 1, source: 1, id: 1 }, { unique: true })
    .index('expiredAt', { expiredAt: 1 })
    .resourceService(buildProofResourceService)
    .create(data => ({
      expiredAt: data.expiredAt ?? days(new Date()).add(1, 'hour').toDate()
    })).build()

export interface ProofResourceService extends Record<string, unknown> {
  load: (userId: string, source: string, id: string) => Promise<Proof | undefined>
  matchPoll: (userId: string, poll: Poll) => Promise<MatchPollResult>
  createLasting: (userId: string, source: string, id: string, livetime?: number, cadance?: plugin.DurationUnitType) => Promise<Proof | undefined>
  cleanUp: () => Promise<void>
  auditProof: (poll: Poll) => Promise<{ [key: string]: number }>
}

export const buildProofResourceService: ResourceServiceBuilder = (res, _) => {
  const _res: ProofResouce = res as unknown as ProofResouce
  const _service: ProofResourceService = {
    load: async (userId, source, id) => {
      const proofCol = await _res.collection()
      return await proofCol.findOne({
        userId: _res.str(userId),
        source: _res.str(source),
        id: _res.str(id)
      }) ?? undefined
    },

    createLasting: async (userId, source, id, livetime: number = 2, cadance?: plugin.DurationUnitType) => {
      if (await _service.load(userId, source, id) != null) {
        return undefined
      }

      return await _res.put({ userId, source, id, expiredAt: days(new Date()).add(livetime, cadance ?? 'month').toDate() })
    },

    matchPoll: async (userId, poll) => {
      const proofCol = await _res.collection()
      if (Array.isArray(poll.requiredProofs) && poll.requiredProofs.length > 0) {
        const conditions = buildProofService(context).getProofConditions(poll)
        const proofsCursor = proofCol.find({ userId: _res.str(userId), $or: conditions })
        const proofs = await proofsCursor.toArray()
        await proofsCursor.close()

        return { proofs, match: proofs.length == conditions.length } // eslint-disable-line
      }

      return { proofs: [], match: true }
    },

    cleanUp: async () => {
      const proofCol = await _res.collection()
      const result = await proofCol.deleteMany({ expiredAt: { $lt: new Date() } })
      if (result.deletedCount > 0) {
        console.info(`Proof cleaned up: ${result.deletedCount}`)
      }
    },

    auditProof: async poll => {
      const proofCol = await _res.collection()
      const allSources = await proofCol.distinct('source', { id: poll.externalId })
      const allValues = await Promise.all(allSources.map(
        async source => [source, await proofCol.countDocuments({ source, id: poll.externalId })]
      ))
      return Object.fromEntries(allValues)
    }
  }

  return _service as unknown as Record<string, unknown>
}

export interface ProofResouce extends Resource<Proof, ProofResourceService> { }

export interface MatchPollResult {
  proofs: Proof[]
  match: boolean
}
