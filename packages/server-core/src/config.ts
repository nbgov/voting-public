import { type Config } from './types'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import * as ethers from 'ethers'
import { hydarteArgon, hydrateEthers, ALLOWED_PROOFSPACE_COUNTRIES } from '@smartapps-poll/common'
import type { EnvOptions } from '@vocdoni/sdk'
import { hash as argon2id, argon2id as argonType } from 'argon2'
import type { ArgonOpts } from '@noble/hashes/argon2'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config()
hydrateEthers(ethers)
hydarteArgon((value: string | Uint8Array, salt: string | Uint8Array, opts: ArgonOpts) => {
  const _salt: Buffer = typeof salt === 'string' ? Buffer.from(salt, 'utf8') : Buffer.from(salt)
  const _value: Buffer = typeof value === 'string' ? Buffer.from(value, 'utf8') : Buffer.from(value)
  return argon2id(Buffer.concat([_value, _salt]), {
    type: argonType,
    salt: Buffer.from(_readConfig(process.env.ADVANCED_SALT ?? 'qqqqqqqqqqo='), 'base64'),
    timeCost: opts.t * 10,
    memoryCost: opts.m,
    parallelism: opts.p,
    raw: true
  }) as unknown as Uint8Array // THIS IS A DIRTY HACK TO PRETEND THAT THE FUNCTION IS SYNC DESPITE IT'S USED ASYNC
})

import utils from 'util'
utils.inspect.defaultOptions.depth = null

const devMode = ['dev', 'development'].includes(process.env.MODE ?? 'production') ||
  ['development'].includes(process.env.NODE_ENV ?? 'production')

const _readConfig = (key: string | undefined) => key != null
  ? key.startsWith('/')
    ? fs.readFileSync(key).toString('utf-8').trim()
    : key.startsWith('./')
      ? fs.readFileSync(path.resolve(__dirname, '..', key)).toString('utf-8').trim()
      : key
  : ''

export const config: Config = {
  devMode,
  url: (process.env.HOST ?? 'http://localhost') + ':' + `${process.env.PORT ?? '8080'}`,
  baseUrl: process.env.BASE_URL,
  redisHost: process.env.REDIS_HOST ?? 'redis://localhost:6379',
  port: parseInt(process.env.PORT ?? '8080'),
  salt: _readConfig(process.env.SECURITY_SALT),
  wrapperGCMKey: _readConfig(process.env.SECURITY_GCMSK_PATH),
  db: {
    useUrl: process.env.DB_USE_URL === 'true' ?? false,
    schemaLocked: process.env.DB_SCHEMA_LOCKED === 'true' ?? false,
    url: _readConfig(process.env.DB ?? 'mongodb://localhost:27017'),
    user: process.env.DB_USER ?? 'admin',
    password: process.env.DB_PASSWORD ?? '',
    defaultDb: process.env.DB_NAME ?? 'poll'
  },
  proofspace: {
    dashboardBackendUrl: process.env.PROOFSPACE_DASHBOARD_BACKEND_URL ?? '',
    serviceId: process.env.PROOFSPACE_SERVICE_ID ?? '',
    pubKeyId: process.env.PROOFSPACE_PUBKEY_ID ?? 'default',
    keystoreCred: {
      schemaId: process.env.PROOFSPACE_KEYSTORE_SCHEMA_ID ?? '',
      credentialId: process.env.PROOFSPACE_KEYSTORE_CRED_ID ?? ''
    },
    telegramCred: {
      schemaId: process.env.PROOFSPACE_TG_SCHEMA_ID ?? '',
      credentialId: process.env.PROOFSPACE_TG_CRED_ID ?? ''
    },
    authCred: {
      schemaId: process.env.PROOFSPACE_AUTH_SCHEMA_ID ?? '',
      credentialId: process.env.PROOFSPACE_AUTH_CRED_ID ?? '',
      interaction: process.env.PROOFSPACE_AUTH_INTERACTION ?? ''
    },
    regCred: {
      schemaId: process.env.PROOFSPACE_REG_SCHEMA_ID ?? '',
      credentialId: process.env.PROOFSPACE_REG_CRED_ID ?? '',
      interaction: process.env.PROOFSPACE_REG_INTERACTION ?? ''
    },
    passportCred: {
      schemaId: process.env.PROOFSPACE_PASS_SCHEMA_ID ?? '',
      credentialId: process.env.PROOFSPACE_PASS_CRED_ID ?? '',
      keyField: process.env.PROOFSPACE_PASS_KEY_FIELD ?? '',
      birthdateMultiplier: parseInt(process.env.PROOFPSACE_PASS_MULTIPLIER ?? '86400')
    },
    ...(process.env.PROOFSPACE_PK_PATH != null ? { pk: _readConfig(process.env.PROOFSPACE_PK_PATH) } : {}),
    allowrdCountries: process.env.ALLOWED_PROOFSPACE_COUNTRIES != null && process.env.ALLOWED_PROOFSPACE_COUNTRIES != ''
      ? process.env.ALLOWED_PROOFSPACE_COUNTRIES.split(',')
      : ALLOWED_PROOFSPACE_COUNTRIES
  },
  newbelarus: {
    keyField: process.env.NEWBELARUS_PASS_KEY_FIELD ?? 'personId'
  },
  vocdoni: {
    env: process.env.VOCDONI_ENV as EnvOptions ?? (devMode ? "dev" : "stg")
  },
  ...(devMode
    ? {
      test: {
        authToken: process.env.TEST_AUTH_TOKEN ?? 'no token'
      }
    }
    : {}),
  telegram: {
    apiUrl: process.env.TG_VOTING_BOT_API_URL ?? 'https://example.api',
    pubKey: _readConfig(process.env.KEY_SRV_BOT_PUB ?? ''),
    cpPubKey: _readConfig(process.env.KEY_CP_BOT_PUB ?? ''),
  },
  security: {
    pk: { main: _readConfig(process.env.SRV_BOT_KEY_PATH) }
  },
  ipWhiteList: (process.env.IP_WHITE_LIST ?? '').split(','),
  origins: [
    /\.googleusercontent\.com$/,
    /\/\/storage\.googleapis\.com$/,
    'https://newbelarus-voting.com',
    ...(process.env.CORS_ORIGINS ?? '').split(',')
  ],
  proxyNumber: parseInt(process.env.PROXY_NUMBER ?? '2'),
  allowedWorkers: (process.env.ALLOWED_WORKERS ?? '*').split(','),
  workersOnly: (process.env.WORKERS_ONLY ?? 'false') === 'true',
  redisCluster: process.env.REDIS_CLUSTER === 'true' ? {
    host: process.env.REDIS_CLUSTER_HOST ?? 'localhost',
    key: process.env.REDIS_CLUSTER_KEY != null ? _readConfig(process.env.REDIS_CLUSTER_KEY) : undefined
  } : undefined,
  auditLogger: {
    enabled: process.env.AUDIT_LOGGER_ENABLED === 'true',
    host: process.env.AUDIT_LOGGER_WINSTON_HOST ?? '',
    path: _readConfig(process.env.AUDIT_LOGGER_WINSTON_PATH)
  },
  ipInfoToken: process.env.IPINFO_TOKEN != '' ? _readConfig(process.env.IPINFO_TOKEN) : undefined,
  veriff: {
    url: process.env.VERIFF_API_URL ?? 'https://stationapi.veriff.com',
    key: _readConfig(process.env.VERIFF_API_KEY ?? ''),
    secret: _readConfig(process.env.VERIFF_API_SECRET ?? ''),
  }
}

console.log('Double check dev mode: ', config.devMode ? 'dev' : 'prod')
