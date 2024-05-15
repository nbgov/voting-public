import type { Request } from 'express'
import type { WorkerHandler } from '../../queue/types'
import type { Context } from '../../types'
import type { Logger } from 'winston'

export interface AuditLogger {
  logger?: Logger
  send: (meta: AuditLoggerMeta, params: AuditLoggerMessageParams, level?: string) => void
  push: (req: Request, params: AuditLoggerMessageParams, level?: string) => void
  view: (req: Request, process: string) => void
  proofspace: (did: string, process: string, outcome?: AuditOutcome | boolean,  stage?: AuditStage) => void
  nb: (req: Request, process: string, outcome?: AuditOutcome | boolean,  stage?: AuditStage) => void
  vocdoni: (req: Request, process: string, outcome?: AuditOutcome | boolean,  stage?: AuditStage) => void
  createMeta: (req: Request) => AuditLoggerMeta
  setContext: (ctx: Context) => void
}

export interface AuditLoggerMessageParams {
  process: string
  stage: AuditStage
  outcome: AuditOutcome
}

export interface AuditLoggerMessageData extends AuditLoggerMessageParams {
  meta?: AuditLoggerMeta
  level: string
}

export interface AuditLoggerMeta {
  ip: string
  host: string
  path: string
  permissions: string
}

export interface AuditLoggerPayload extends AuditLoggerMessageParams {
  ipProduct: string
  country: string
}

export enum AuditStage {
  INITIALIZATION = 'initialization',
  PROGRESS = 'progress',
  FINALIZATION = 'finalization',
  INSTANT = 'instant'
}

export enum AuditOutcome {
  UNKNOWN = 'unknown',
  ERROR = 'error',
  VIOLATION = 'violation',
  SUCCESS = 'success',
  FAILUER = 'failure',
  ABUSE = 'abuse',
  RISK = 'risk',
  INDIFFERENT = 'indifferent'
}

export interface AuditLoggerSendHandler {
  (context: Context): WorkerHandler<AuditLoggerMessageData, void> & {
    send: (data: AuditLoggerMessageData) => Promise<void>
  }
}
