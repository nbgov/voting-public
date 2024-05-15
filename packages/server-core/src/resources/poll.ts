import { CensusStatus, checkRole, MemberRole, PollStatus, truncatePoll } from '@smartapps-poll/common'
import type { Member, NewPoll, Pagination, Poll, PollInfo, User, Census } from '@smartapps-poll/common'
import { createResourceBuilder } from '../db/resource'
import { type Resource, type ResourceServiceBuilder } from '../db/types'
import { type Context } from '../types'
import days from 'dayjs'
import { PollManagerError, PollManagerIncomplete, PollTransitionError } from './errors'
import { type MemberResource } from './member'

export const createPollResource = (ctx: Context): Resource => createResourceBuilder('poll', ctx)
  .schema({
    bsonType: 'object',
    title: 'Poll',
    required: [
      'title', 'header', 'orgId', 'serviceId', 'status', 'manual',
      'strictRegistration', 'registrationEnd', 'startDate', 'endDate',
      'createdAt', 'census'
    ],
    properties: {
      _id: { bsonType: 'string' },
      code: {
        bsonType: 'string',
        description: 'Voting code that simplifies it\'s identification'
      },
      title: {
        bsonType: 'string',
        description: 'Title of the poll'
      },
      description: {
        bsonType: 'string',
        description: 'Description of the poll'
      },
      header: {
        bsonType: 'string',
        description: 'Header of the poll'
      },
      orgId: {
        bsonType: 'string',
        description: 'Id of the organization that manages the poll'
      },
      serviceId: {
        bsonType: 'string',
        description: 'Id of the service from which the managing organization comes from'
      },
      managerId: {
        bsonType: 'string',
        description: 'Id of the organization manager who created the voting process and manages it'
      },
      status: {
        enum: [PollStatus.UNPUBLISHED, PollStatus.PUBLISHED, PollStatus.STARTED, PollStatus.PAUSED, PollStatus.CANCELED, PollStatus.FINISHED],
        description: 'Id of the organization manager who created the voting process and manages it'
      },
      uiType: {
        bsonType: 'string',
        description: 'Different voting could require different UI rendering.'
      },
      manual: {
        bsonType: 'bool',
        description: 'Should the manager manually manage milstones or the systems will do it automatically'
      },
      strictRegistration: {
        bsonType: 'bool',
        description: 'Should users register at the poll manually or available users can be registered automatically'
      },
      registrationEnd: {
        bsonType: 'date',
        description: 'End of user registration'
      },
      startDate: {
        bsonType: 'date',
        description: 'Time of the poll official start'
      },
      endDate: {
        bsonType: 'date',
        description: 'Time of the poll official end'
      },
      createdAt: {
        bsonType: 'date',
        description: 'Time of the poll creation'
      },
      externalId: {
        bsonType: 'string',
        description: 'Id of the voting process inside the voting service'
      },
      census: {
        bsonType: 'object',
        description: 'Object with references to censes from voting service',
        required: ['externalId', 'status'],
        properties: {
          url: {
            bsonType: 'string',
            description: 'Published census url'
          },
          token: {
            bsonType: 'string',
            description: 'Authentication token for census management'
          },
          externalId: {
            bsonType: 'string',
            description: 'Census id from the voting service'
          },
          type: {
            bsonType: 'string',
            description: 'Type of the census that describes the way of participation'
          },
          size: {
            bsonType: 'int',
            description: 'Maximum census size'
          },
          status: {
            enum: [CensusStatus.UNPUBLISHED, CensusStatus.PUBLISHED],
            description: 'Whether the census is open for futher registration or not'
          }
        }
      },
      requiredProofs: {
        bsonType: 'array',
        additionalProperties: false,
        items: {
          bsonType: 'object',
          required: ['_id', 'type'],
          additionalProperties: false,
          description: 'List of proofs that are required by the poll to particiapte',
          properties: {
            _id: {
              bsonType: 'string',
              description: 'Unique id of the filter to simplify the development'
            },
            type: {
              bsonType: 'string',
              description: 'Type of the filter. It allows to choose proper implementation of the filter.'
            },
            guideUrl: {
              bsonType: 'string',
              description: 'Optional Url of a public guide of how to get required proof.'
            },
            isMandatory: {
              bsonType: 'bool',
              description: 'Optional flag signifying that the proof need to be checked mandatory'
            },
            meta: {
              bsonType: 'object',
              description: 'A data object that is used by the filter implementation'
            }
          }
        }
      },
      questions: {
        bsonType: 'array',
        additionalProperties: false,
        items: {
          bsonType: 'object',
          required: ['title', 'choices'],
          additionalProperties: false,
          description: 'List of questions from the poll',
          properties: {
            title: {
              bsonType: 'string',
              description: 'Title of the poll question'
            },
            description: {
              bsonType: 'string',
              description: 'Description of the poll question'
            },
            choices: {
              bsonType: 'array',
              additionalProperties: false,
              items: {
                bsonType: 'object',
                description: 'List of choices to answer the question',
                required: ['title', 'value'],
                additionalProperties: false,
                properties: {
                  title: {
                    bsonType: 'string',
                    description: 'Title of the poll question'
                  },
                  meta: {
                    bsonType: 'object',
                    description: 'Additioanl meta information that is used by UI renderer'
                  },
                  value: {
                    bsonType: 'int',
                    description: 'Simple value id of the choice'
                  }
                }
              }
            }
          }
        }
      }
    }
  })
  .index('serviceOrgId', { serviceId: 1, orgId: 1 })
  .index('externalId', { externalId: 1 })
  .index('serviceManagerId', { serviceId: 1, managerId: 1 })
  .index('registrationEnd', { status: 1, registrationEnd: -1 })
  .index('orgDates', { serviceId: 1, orgId: 1, status: 1, startDate: -1, endDate: -1 })
  .index('orgRegistrationEnd', { serviceId: 1, orgId: 1, status: 1, registrationEnd: -1 })
  .index('search', {
    serviceId: 1,
    orgId: 1,
    status: 1,
    startDate: -1,
    endDate: -1,
    registrationEnd: -1,
    title: 'text',
    header: 'text',
    description: 'text'
  })
  .resourceService(buildPollResourceService)
  .create(data => {
    const registrationEnd = data.registrationEnd as Date ?? days().add(7, 'day').toDate()
    const startDate = data.startDate as Date ?? days(registrationEnd).add(1, 'day').toDate()
    const endDate = data.endDate as Date ?? days(startDate).add(7, 'day').toDate()
    return {
      createdAt: new Date(),
      header: data.header ?? '',
      status: PollStatus.UNPUBLISHED,
      manual: data.manual ?? true,
      strictRegistration: data.strictRegistration ?? false,
      registrationEnd,
      startDate,
      endDate,
      census: data.census ?? {}
    }
  }).build()

export interface PollResouceService extends Record<string, unknown> {
  create: (poll: NewPoll, manager: Member) => Promise<Poll | undefined>
  update: (poll: PollInfo, update: Partial<Poll>, manager: Member, permission: PollAuthorization) => Promise<PollInfo | undefined>
  delete: (poll: PollInfo, manager: Member) => Promise<boolean>
  authorize: (poll: Poll, user?: User | undefined, permission?: PollAuthorization) => Promise<PollInfo>
  list: (pager: Pagination, status?: PollStatus | PollStatus[], serviceId?: string, orgId?: string, strategy?: string) => Promise<Poll[]>
}

export const buildPollResourceService: ResourceServiceBuilder = (res, ctx) => {
  const _res: PollResource = res as unknown as PollResource
  const memRes: MemberResource = ctx.db.resource('member')
  const _service: PollResouceService = {
    create: async (poll, manager) => {
      if (manager.orgId == null || manager.serviceId == null) {
        throw new PollManagerIncomplete('poll.manager')
      }
      if (manager.role == null || !checkRole(manager.role, MemberRole.MANAGER)) {
        throw new PollManagerError()
      }

      poll.census = await ctx.strategy.service().census.create(poll)
      poll.serviceId = manager.serviceId
      poll.orgId = manager.orgId

      return await _res.put(truncatePoll(poll))
    },

    delete: async (poll, manager) => {
      if (manager.orgId == null || manager.serviceId == null) {
        throw new PollManagerIncomplete('poll.manager')
      }
      if (manager.role == null || !checkRole(manager.role, MemberRole.MANAGER)) {
        throw new PollManagerError()
      }
      const coll = await _res.collection()
      const result = await coll.deleteOne({ _id: _res.str(poll._id) })

      return result.deletedCount > 0
    },

    update: async (poll, update, manager, permission) => {
      const censusService = ctx.strategy.service().census
      let toUpdate: Partial<Poll> = {}
      if (manager?.externalId == null ||
        (poll.managerId != null && poll.managerId !== manager.externalId)) {
        throw new PollManagerError('poll.update.unautorized')
      }
      machine: switch (poll.status) { // eslint-disable-line
        case PollStatus.UNPUBLISHED:
          const fieldsToUpdate = [
            'title', 'code', 'header', 'description', 'registrationEnd', 'startDate', 'endDate', 'questions'
          ]
          if (censusService.isCSPType(poll.census?.type ?? '')) {
            fieldsToUpdate.push('census')
          }
          fieldsToUpdate.filter(field => update[field as keyof Poll] != null).forEach(field => {
            if (field === 'census' && update.census != null) {
              toUpdate.census = poll.census as Census
              toUpdate.census.size = parseInt(update.census.size as unknown as string)
            } else {
              toUpdate[field as keyof Poll] = (update[field as keyof Poll]) as any
            }
            return toUpdate[field as keyof Poll]
          })
          transformPollDates(toUpdate)
          switch (update.status) {
            case PollStatus.PUBLISHED:
              if (permission === PollAuthorization.MANAGEMENT) {
                toUpdate.status = PollStatus.PUBLISHED
                toUpdate.managerId = manager.externalId
              } else {
                throw new PollManagerError('poll.update.permission')
              }
              break
            case PollStatus.STARTED:
              if (permission === PollAuthorization.MANAGEMENT
                && censusService.isCSPType(poll.census?.type ?? '')) {
                // console.log('Restore started status')
                toUpdate.census = await ctx.strategy.service().census.publish(poll)
                toUpdate.status = PollStatus.STARTED
                toUpdate.managerId = manager.externalId
              } else {
                throw new PollManagerError('poll.update.permission')
              }
              break
          }
          toUpdate = truncatePoll(toUpdate as PollInfo)
          break
        case PollStatus.PUBLISHED:
          switch (update.status) {
            case PollStatus.STARTED:
              toUpdate.census = await ctx.strategy.service().census.publish(poll)
              toUpdate.status = PollStatus.STARTED
              break
            default:
              throw new PollTransitionError()
          }
          break
        case PollStatus.STARTED:
          if (update.status != null && update.status !== PollStatus.STARTED) {
            switch (update.status) {
              case PollStatus.FINISHED:
                toUpdate.status = update.status
                break machine // eslint-disable-line
              default:
                throw new PollTransitionError()
            }
          }
          if (poll.externalId != null || update.externalId == null) {
            throw new PollTransitionError()
          }
          toUpdate.externalId = update.externalId
          break
        default:
          throw new PollTransitionError()
      }
      const coll = await _res.collection()
      const result = await coll.updateOne(
        { _id: poll._id, status: poll.status },
        { $set: toUpdate }
      )
      if (result.modifiedCount === 0) {
        throw new PollManagerError('poll.update.failed')
      }
      return { ...poll, ...toUpdate, manager }
    },

    authorize: async (poll, user, permission) => {
      permission = permission ?? PollAuthorization.PUBLIC
      let member = user == null
        ? undefined
        : await memRes.service.authorize(user, poll.serviceId, poll.orgId)
      const presentation: Partial<Poll> = { ...poll }
      const authorized = poll.managerId == null
        ? member != null
        : poll.managerId === member?.externalId
      switch (permission) {
        case PollAuthorization.PUBLIC:
          delete presentation.census?.token
          delete presentation.managerId
          return { ...presentation, manager: member } as unknown as PollInfo
        case PollAuthorization.MANAGEMENT:
          if (!authorized) {
            delete presentation.census?.token
          }
          if (member == null) {
            delete presentation.managerId
          } else if (presentation.managerId != null) {
            member = await memRes.service.load(poll.serviceId, poll.orgId, poll.managerId)
            if (member != null) {
              member = memRes.service.denormalize(member)
            }
          }
          return { ...presentation, manager: authorized ? member : undefined } as unknown as PollInfo
        case PollAuthorization.INTERNAL:
        default:
          return { ...presentation, manager: member } as unknown as PollInfo
      }
    },

    list: async (pager, status, serviceId, orgId, strategy) => {
      status = status == null ? undefined : Array.isArray(status) ? status : [status]
      const pollCol = await _res.collection()
      const query = {
        ...(serviceId != null ? { serviceId: _res.str(serviceId) } : {}),
        ...(orgId != null ? { orgId: _res.str(orgId) } : {}),
        ...(status != null ? { status: { $in: status } } : {}),
        ...(strategy != null ? { 'requiredProofs.type': _res.str(strategy) } : {})
      }
      pager.total = await pollCol.countDocuments(query)
      const listCursor = pollCol.find(query).sort({ createdAt: -1 })
        .skip(pager.page * pager.size).limit(pager.size)

      return await listCursor.toArray()
    }
  }

  return _service
}

export const transformPollDates = (poll: Partial<Poll>): Partial<Poll> => {
  ['registrationEnd', 'startDate', 'endDate'].forEach(
    (field) => {
      poll[field as keyof Poll] = (
        typeof poll[field as keyof Poll] === 'string'
          ? new Date(poll[field as keyof Poll] as string)
          : poll[field as keyof Poll]
      ) as any
    }
  )

  return poll
}

export enum PollAuthorization {
  PUBLIC = 'public',
  INTERNAL = 'interal',
  MANAGEMENT = 'management'
}

export interface PollResource extends Resource<Poll, PollResouceService> { }
