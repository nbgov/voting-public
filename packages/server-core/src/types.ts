import type { NewBelarusConfig, ProofspaceConfig } from '@smartapps-poll/common'
import { type EnvOptions } from '@vocdoni/sdk'
import type { CreateDbOptions, Connection } from './db/types'
import { type ServerStrategy } from './startegy/types'
import { type Cluster, type Redis } from 'ioredis'
import { type QueueManager } from './queue/types'
import type { AuditLogger } from './model/audit/types'

export interface Context {
  config: Config
  db: Connection
  redis: Redis | Cluster
  queue: QueueManager
  strategy: ServerStrategy
  auditLogger: AuditLogger
}

export interface Config {
  devMode: boolean
  url: string
  baseUrl?: string
  redisHost: string
  port: number
  salt: string
  wrapperGCMKey: string
  db: CreateDbOptions
  proofspace: ProofspaceConfig
  vocdoni: VocdoniConfig
  newbelarus: NewBelarusConfig
  test?: TestConfig
  telegram: TelegramConfig
  security: {
    pk: { main: string }
  }
  ipWhiteList: string[],
  origins: (string | RegExp)[]
  proxyNumber: number
  allowedWorkers: string[]
  workersOnly: boolean
  redisCluster?: {
    host: string
    key?: string
  },
  auditLogger: {
    enabled: boolean
    host: string
    path: string
  }
  ipInfoToken?: string
}

export interface TelegramConfig {
  apiUrl: string
  pubKey: string
  cpPubKey: string
}

export interface VocdoniConfig {
  env: EnvOptions
}

export interface TestConfig {
  authToken: string
}
