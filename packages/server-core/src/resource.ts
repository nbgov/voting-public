import { createAuthResource } from './resources/auth'
import { createMemberResource } from './resources/member'
import { createOrgMemberResource } from './resources/org-member'
import { createOrgResource } from './resources/organization'
import { createPollResource } from './resources/poll'
import { createProofResource } from './resources/proof'
import { createIntegrationResource } from './resources/service'
import { createUserResource } from './resources/user'
import type { Context } from './types'

export const createResources = (context: Context): void => {
  context.db.register(createAuthResource(context))
    .register(createUserResource(context))
    .register(createIntegrationResource(context))
    .register(createOrgResource(context))
    .register(createMemberResource(context))
    .register(createOrgMemberResource(context))
    .register(createPollResource(context))
    .register(createProofResource(context))
}
