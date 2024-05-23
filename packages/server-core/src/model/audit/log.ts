
import { createLogger, format, transports, type Logger } from 'winston'
import type { Config, Context } from '../../types'
import { AuditOutcome, AuditStage, type AuditLogger, type AuditLoggerPayload, type AuditLoggerSendHandler } from './types'
import { AUDIT_WORKER, QUEUE_AUDIT } from '../../queue/consts'
import { stabWaitMethod } from '../../queue/utils'
import { hash, randomToken } from '@smartapps-poll/common'
import axios from 'axios'
import { PROOFSPACE_AUDIT_MARKER, VERIFF_AUDIT_MARKER, apiAuditMarkers } from './const'
import type { VeriffHookRequest } from '../veriff/types'
import { filterVeriffRecord, isVeriffDecision, isVeriffRecordSafe } from '../veriff/utils'
import { buildStoreHelper } from '../redis'

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
            ? outcome ? AuditOutcome.SUCCESS : AuditOutcome.FAILUER : outcome
        }
      )
    },

    nb: (req, process, outcome = false, stage = AuditStage.FINALIZATION) => {
      _logger.send(
        _logger.createMeta(req),
        {
          process: `newbelarus:${process}`, stage, outcome: typeof outcome === 'boolean'
            ? outcome ? AuditOutcome.SUCCESS : AuditOutcome.FAILUER : outcome
        }
      )
    },

    webPass: (req, process, outcome = false, stage = AuditStage.FINALIZATION) => {
      const hookEvent = req.body as VeriffHookRequest
      _logger.send(
        process === 'hook' ? {
          ip: isVeriffDecision(hookEvent) ? hookEvent.technicalData.ip : 'unknown',
          host: VERIFF_AUDIT_MARKER, path: '', permissions: 'hmac'
        } : _logger.createMeta(req),
        {
          process: `webpass:${process}`, stage, outcome: typeof outcome === 'boolean'
            ? outcome ? AuditOutcome.SUCCESS : AuditOutcome.FAILUER : outcome
        }
      )
    },

    veriffRisk: (ip, source, payload, outcome = true, process = 'risk-check', stage = AuditStage.PROGRESS) => {
      _logger.send(
        { ip, host: source, path: '', permissions: 'veriff-risk-check' },
        {
          payload, process: `veriff:${process}`, stage, outcome: typeof outcome === 'boolean'
            ? outcome ? AuditOutcome.RISK : AuditOutcome.ABUSE : outcome
        }
      )
    },

    vocdoni: (req, process, outcome = false, stage = AuditStage.FINALIZATION) => {
      _logger.send(
        _logger.createMeta(req),
        {
          process: `csp:${process}`, stage, outcome: typeof outcome === 'boolean'
            ? outcome ? AuditOutcome.SUCCESS : AuditOutcome.FAILUER : outcome
        }
      )
    },

    createMeta: req => ({
      ip: req.ip ?? req.header('x-forwarded-for') ?? '',
      host: req.hostname,
      path: req.path,
      permissions: req.user != null && typeof req.user === 'object' ? 'authenticated' : 'guest'
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
      const store = buildStoreHelper(ctx)
      const ipSaltKey = 'ip-salt:' + ip
      const ipSalt = await store.get(ipSaltKey) ?? randomToken().substring(0, Math.floor(Math.random() * 32))
      if (!await store.has(ipSaltKey)) {
        await store.set(ipSaltKey, ipSalt, 3600 * 12)
      }
      let ipProduct = hash(ctx.config.salt, ip + ipSalt).slice(-6)

      switch (job.data.meta?.host) {
        case PROOFSPACE_AUDIT_MARKER:
          ipProduct = 'did:' + ipProduct
      }

      let country = ctx.config.ipWhiteList.includes(ip) ? 'secured' : 'unknown'

      if (!apiAuditMarkers.includes(job.data.meta?.host ?? '')) {
        const key = 'ip-country:' + hash(ctx.config.salt, ip)
        const _country = await store.get<string>(key)
        if (_country != null) {
          country = _country
        } else if (ctx.config.ipInfoToken != null && country === 'unknown') {
          try {
            country = (await axios.get(`https://ipinfo.io/${ip}/country?token=${ctx.config.ipInfoToken}`)).data as string
          } catch {
            country = 'unindentified'
          } finally {
            await store.set(key, country, 3600)
          }
        }
      }
      const data: AuditLoggerPayload = {
        ipProduct, country,
        process: job.data.process,
        stage: job.data.stage,
        outcome: job.data.outcome
      }
      // https://docs.datadoghq.com/api/latest/logs/
      let message = `User ${ipProduct} from ${country} with ${job.data.meta?.permissions ?? 'unknown'} permission`
        + ` in ${job.data.process} on ${job.data.stage}: ${job.data.outcome}`
      if (job.data.meta?.permissions === 'veriff-risk-check') {
        message += `; decision: ${JSON.stringify(isVeriffRecordSafe(job.data.payload))} ${JSON.stringify(filterVeriffRecord(job.data.payload))}`
      }
      ctx.auditLogger.logger.log(job.data.level, message, {
        ...data,
        hostname: job.data.meta?.host ?? 'newbelarus-voting',
        service: `${ctx.config.devMode ? 'test' : 'prod'}:nbpoll:vocdoni-${ctx.config.vocdoni.env}`,
        path: job.data.meta?.path ?? 'empty',
        ddsource: 'nbpoll_audit',
        permission: job.data.meta?.permissions ?? 'unknown',
        ddtags: `${job.data.process},${ctx.config.workersOnly ? 'worker' : 'http'}`
      })
    }
  },

  send: async data => {
    await ctx.queue.get(QUEUE_AUDIT).add('audit:send', data)
  },

  wait: stabWaitMethod,
})
