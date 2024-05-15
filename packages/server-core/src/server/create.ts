import express from 'express'
import http from 'http'
import BodyParser from 'body-parser'
import type { Server } from './types'
import type { Context } from '../types'
import { rateLimit } from 'express-rate-limit'

import cors from 'cors'
import { buildProofCleanUpHandler } from '../model/poll/clenup'

export const createServer = (context: Context): Server => {
  const _server = express()

  const proofHandler = buildProofCleanUpHandler(context)
  if (proofHandler.repeat != null) {
    void proofHandler.repeat()
  }

  _server.use(cors({ origin: context.config.origins }))
  _server.use(BodyParser.json())
  _server.set('trust proxy', context.config.proxyNumber)
  _server.use(rateLimit({
    limit: 1000,
    validate: {
      trustProxy: false,
    },
    skip: req => {
      if (context.config.devMode) {
        console.log('------------')
        console.log('we arrive: ' + req.path)
        console.log('client addresses: ' + req.header('x-forwarded-for') + ' ' + req.socket.remoteAddress)
        console.log('final client address: ' + req.ip)
        console.log('proxy number considered: ' + context.config.proxyNumber.toString())
      }
      if (context.config.ipWhiteList.some(ip => req.header('x-forwarded-for')?.includes(ip) || req.socket.remoteAddress === ip)) {
        if (context.config.devMode) {
          console.log('Skip rate limiter', {
            'forwareder': req.header('x-forwarded-for'),
            'addr': req.socket.remoteAddress,
            'match': context.config.ipWhiteList
          })
        }
        return true
      }
      // if (context.config.urlWhiteList.some(pattern => req.path.startsWith(pattern))) {
      //   context.config.devMode && console.log('Skip by url', { path: req.path })
      //   return true
      // }
      return false
    }
  }))

  const _close = (reason: string, http?: http.Server) => async () => {
    console.info(`Close with reason: ${reason}`)
    await context.queue?.close()
    console.info('queue closed')
    await context.redis?.quit()
    console.info('redis closed')
    await context.db?.disconnect()
    console.info('db disconnected')
    http?.close()
    console.info('http closed')
    process.exit()
  }

  const _instance: Server = {
    inject: context => {
      _server.use((req, _, next) => {
        req.context = context
        next()
      })
    },

    plugin: builder => {
      _server.use(builder(context))
    },

    router: (builder) => {
      if (context.config.baseUrl != null) {
        _server.use(context.config.baseUrl, builder(context))
      } else {
        _server.use(builder(context))
      }
    },

    start: () => {
      const http = context.config.workersOnly ? undefined : _server.listen(context.config.port, () => {
        console.info(`Voting service is listening on port ${context.config.port}`)
      })
      if (context.config.workersOnly) {
        console.info('Server runs only workers')
      }

      process.once('SIGINT', _close('SIGINT', http))
      process.once('SIGTERM', _close('SIGTERM', http))
    }
  }

  return _instance
}
