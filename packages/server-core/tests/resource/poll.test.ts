import { describe, expect, test } from '@jest/globals'
import { MemberRole, randomToken } from '@smartapps-poll/common'
import { v4 as uuid } from 'uuid'
import { context } from '../../src/context'
import { PollResource } from '../../src/resources/poll'

describe('Poll resource tests', () => {
  test.skip('create', async () => {
    const resouce: PollResource = context.db.resource('poll')
    const poll = await resouce.service.create({ title: 'Test poll' }, {
      _id: uuid(),
      userId: randomToken(),
      active: true,
      name: 'Test member',
      role: MemberRole.MANAGER,
      createdAt: new Date(),
      externalId: randomToken(),
      orgId: randomToken(),
      serviceId: randomToken()
    })
    expect(typeof poll?.census.externalId).toBe('string')
  })
})