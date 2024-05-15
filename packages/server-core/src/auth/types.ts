import type { RequestHandler } from 'express'
import type { PluginBuilder } from '../server/types'

export interface Authentication {
  plugin: () => PluginBuilder
  ensure: (code?: number, optional?: boolean) => RequestHandler[]
  pass: (optional?: boolean) => RequestHandler
  auth: (method: string) => RequestHandler[]
  pickUp: () => RequestHandler[]
}
