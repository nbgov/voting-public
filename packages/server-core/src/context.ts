import { config } from './config'
import { createDb } from './db/create'
import { createAuditLogger } from './model/audit/log'
import { createResources } from './resource'
import { createDefaultStrategy } from './startegy/default'
import type { Context } from './types'

const _context: Partial<Context> = {
  config,
  db: createDb(config.db),
  auditLogger: createAuditLogger(config)
}
_context.auditLogger?.setContext(_context as Context)
createResources(_context as Context)
_context.strategy = createDefaultStrategy(_context as Context)

export const context = _context as Context
