import { buildSendToPsHandler } from '../auth/method/proofspace/utils'
import { buildNBStartHandler } from '../model/nb/start'
import { buildNBVerifyHandler } from '../model/nb/verify'
import { buildMembershipIntegrationRequest } from '../model/member/integration'
import { proofspacePubKeyRequest } from '../model/proofspace/pubkey'
import { serviceAuthenticationRequest } from '../model/services/remote'
import { buildTelegramDectyptHandler } from '../model/telegram/crypto'
import type { Context } from '../types'
import { ALL_WORKERS } from './consts'
import type { WorkerHandler, WorkerHandlerWithCtx } from './types'
import { buildVocdoniStepHandler } from '../model/vocdoni/step'
import { buildCensusRegisterHandler } from '../model/vocdoni/register'
import { buildVocdoniSignHandler } from '../model/vocdoni/sign'
import { buildUserTokenAuth } from '../model/user/auth'
import { buildPsPayloadProcessHandler } from '../auth/method/proofspace/async-payload'
import { buildAuthCleanUpHandler } from '../model/user/clenup'
import { buildProofCleanUpHandler } from '../model/poll/clenup'
import { buildCensusProofHandler } from '../model/vocdoni/proof'
import { buildTelegramPollAuthHandler } from '../model/telegram/poll'
import { buildAuditInfoHandler } from '../model/audit/info'
import { buildAuditLoggerSendHandler } from '../model/audit/log'
import { buildVeriffInitHandler } from '../model/veriff/init'
import { buildVeriffHookHandler } from '../model/veriff/hook'
import { buildPollCreateHandler } from '../model/poll/create'
import { buildPollUpdateHandler } from '../model/poll/update'
import { buildPollDeleteHandler } from '../model/poll/delete'

export const registerAllWorkers = (context: Context, tags?: string[], workers?: (WorkerHandler | WorkerHandlerWithCtx)[]) => {
  if (tags == null) {
    tags = context.config.allowedWorkers
  }
  ((workers ?? allWorkers) as (WorkerHandler | WorkerHandlerWithCtx)[]).filter(
    (worker: WorkerHandler | WorkerHandlerWithCtx) => {
      if (tags?.includes(ALL_WORKERS)) {
        console.info(`Initialize worker: ${worker.name}`)
        return true
      }
      worker = typeof worker === 'function' ? worker(context) : worker
      const allowed = worker.tags?.some((tag: string) => tags?.includes(tag))
      console.info(`Worker initialization: ${worker.name} — ${allowed ? 'enabled' : 'disabled'}`)
      return allowed
    }
  ).map(
    (worker: WorkerHandler | WorkerHandlerWithCtx) => {
      worker = typeof worker === 'function' ? worker(context) : worker
      context.queue.listen(worker.queue, worker.name, worker.handler)
      return worker
    }
  )
}

export const allWorkers = [
  buildPsPayloadProcessHandler,
  serviceAuthenticationRequest,
  proofspacePubKeyRequest,
  buildMembershipIntegrationRequest,
  buildSendToPsHandler,
  buildTelegramDectyptHandler,
  buildNBStartHandler,
  buildNBVerifyHandler,
  buildVocdoniStepHandler,
  buildVocdoniSignHandler,
  buildCensusRegisterHandler,
  buildUserTokenAuth,
  buildAuthCleanUpHandler,
  buildProofCleanUpHandler,
  buildCensusProofHandler,
  buildTelegramPollAuthHandler,
  buildAuditInfoHandler,
  buildAuditLoggerSendHandler,
  buildVeriffInitHandler,
  buildVeriffHookHandler,
  buildPollCreateHandler,
  buildPollUpdateHandler,
  buildPollDeleteHandler
]
