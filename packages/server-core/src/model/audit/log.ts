
import { createLogger, format, transports, type Logger } from 'winston'
import type { Config, Context } from '../../types'
import { AuditOutcome, AuditStage, type AuditLogger, type AuditLoggerPayload, type AuditLoggerSendHandler } from './types'
import { AUDIT_WORKER, QUEUE_AUDIT } from '../../queue/consts'
import { stabWaitMethod } from '../../queue/utils'
import { hash } from '@smartapps-poll/common'
import axios from 'axios'
import { PROOFSPACE_AUDIT_MARKER, apiAuditMarkers } from './const'

export const createAuditLogger = (config: Config): AuditLogger => {

  const transportConfig = {
    host: config.auditLogger.host,
    path: `/${config.auditLogger.path}`,
    ssl: true
  }

  let logger: Logger | undefined = undefined

  let _ctx: Context | undefined = undefined

  if (config.auditLogger.enabled) {
    logger = createLogger({
      level: 'info',
      exitOnError: false,
      format: format.json(),
      transports: [new transports.Http(transportConfig)],
    })
  }

  const _logger: AuditLogger = {
    logger,

    setContext: ctx => {
      _ctx = ctx
    },

    send: (meta, params, level = 'info') => {
      if (_ctx != null && logger != null) {
        void buildAuditLoggerSendHandler(_ctx).send({ ...params, meta, level })
      }
    },

    push: (req, params, level) => {
      _logger.send(_logger.createMeta(req), params, level)
    },

    view: (req, process) => {
      _logger.send(_logger.createMeta(req), {
        process,
        stage: AuditStage.INITIALIZATION,
        outcome: AuditOutcome.INDIFFERENT
      })
    },

    proofspace: (did, process, outcome = false, stage = AuditStage.FINALIZATION) => {
      _logger.send(
        { ip: did, host: PROOFSPACE_AUDIT_MARKER, path: '', permissions: 'keypair' },
        {
          process: `proofspace:${process}`, stage, outcome: typeof outcome === 'boolean'
            ? outcome ? AuditOutcome.SUCCESS : AuditOutcome.FAILUER
            : outcome
        }
      )
    },

    nb: (req, process, outcome = false, stage = AuditStage.FINALIZATION) => {
      _logger.send(
        _logger.createMeta(req),
        {
          process: `newbelarus:${process}`, stage, outcome: typeof outcome === 'boolean'
            ? outcome ? AuditOutcome.SUCCESS : AuditOutcome.FAILUER
            : outcome
        }
      )
    },

    vocdoni: (req, process, outcome = false, stage = AuditStage.FINALIZATION) => {
      _logger.send(
        _logger.createMeta(req),
        {
          process: `csp:${process}`, stage, outcome: typeof outcome === 'boolean'
            ? outcome ? AuditOutcome.SUCCESS : AuditOutcome.FAILUER
            : outcome
        }
      )
    },

    createMeta: req => ({
      ip: req.ip ?? req.header('x-forwarded-for') ?? '',
      host: req.hostname,
      path: req.path,
      permissions: req.user != null ? 'authenticated' : 'guest'
    })
  }

  return _logger
}

export const buildAuditLoggerSendHandler: AuditLoggerSendHandler = ctx => ({
  tags: [AUDIT_WORKER],

  queue: QUEUE_AUDIT,

  name: 'audit:send',

  handler: async job => {
    if (ctx.auditLogger.logger != null) {
      const ip = job.data.meta?.ip ?? 'unkown'
      let ipProduct = hash(ctx.config.salt, ip).slice(-6)

      switch (job.data.meta?.host) {
        case PROOFSPACE_AUDIT_MARKER:
          ipProduct = 'did:' + ipProduct
      }

      let country = ctx.config.ipWhiteList.includes(ip) ? 'secured' : 'unknown'

      if (!apiAuditMarkers.includes(job.data.meta?.host ?? '')) {
        if (ctx.config.ipInfoToken != null && country === 'unknown') {
          try {
            country = (await axios.get(`https://ipinfo.io/${ip}/country?token=${ctx.config.ipInfoToken}`)).data as string
          } catch {
            country = 'unindentified'
          }
        }
      }
      const data: AuditLoggerPayload = {
        ipProduct, country,
        process: job.data.process,
        stage: job.data.stage,
        outcome: job.data.outcome
      }
      // curl ipinfo.io/8.8.8.8/country?token=$TOKEN
      // https://docs.datadoghq.com/api/latest/logs/
      const message = `User ${ipProduct} from ${country} in ${job.data.process} on ${job.data.stage}: ${job.data.outcome}`
      ctx.auditLogger.logger.log(job.data.level, message, {
        ...data,
        hostname: job.data.meta?.host ?? 'newbelarus-voting',
        service: `${ctx.config.devMode ? 'test' : 'prod'}:nbpoll:vocdoni-${ctx.config.vocdoni.env}`,
        path: job.data.meta?.path,
        ddsource: 'nbpoll_audit',
        ddtags: `${job.data.process},${ctx.config.workersOnly ? 'worker' : 'http'}`
      })
    }
  },

  send: async data => {
    await ctx.queue.get(QUEUE_AUDIT).add('audit:send', data)
  },

  wait: stabWaitMethod,
})
