import type { RequestHandler } from 'express'
import type { Context } from '../types'

export interface Server {
  inject: (context: Context) => void

  plugin: (builder: PluginBuilder) => void

  router: (router: PluginBuilder, baseUrl?: string) => void

  start: () => void
}

export type PluginBuilder = (context: Context) => RequestHandler
