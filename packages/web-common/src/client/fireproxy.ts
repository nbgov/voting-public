import type { AxiosPromise, InternalAxiosRequestConfig } from 'axios'
import { getAdapter } from 'axios'
import type { CommonContext } from '../context/types'
import { shouldSkipGeo } from './fireproxy/geo-skip'
const { default: settle }: any = require('axios/unsafe/core/settle.js')

const { chacha20 }: any = require('@fproxy/crypto-chacha20')
const { FirestoreClient }: any = require('@fproxy/transport-firestore')
const { createFetch }: any = require('@fproxy/fetch')

const skipPatterns: string[] = []

export const makeFireproxyAdapter = (ctx: CommonContext) => {
  const projectId = ctx.config.fireproxyProject
  const crypto = chacha20()
  const firestore = new FirestoreClient({ projectId })
  const fireFetch = createFetch({ crypto, transports: [firestore] })

  return async (config: InternalAxiosRequestConfig): AxiosPromise => {
    const url = config.url?.startsWith('https://') ? config.url : (config.baseURL ?? '') + config.url

    if (skipPatterns.some(pattern => url.includes(pattern)) || await shouldSkipGeo(ctx)) {
      const xhr = getAdapter('xhr')
      return xhr(config)
    }

    console.info('FIREPROXY URL:', url, config.method)

    return new Promise(async (resolve, reject) => {
      try {
        const result = await fireFetch(url, {
          method: (config.method ?? 'GET').toUpperCase(),
          body: config.data != null ?
            typeof config.data === 'object'
              ? JSON.stringify(config.data)
              : config.data
            : undefined,
          headers: config.headers
        })
        let body = ''
        let data: any = ''

        const stream = result.body as ReadableStream
        if (stream != null) {
          const reader = stream.getReader()
          const textDecoder = new TextDecoder()
          let done = true
          do {
            const chunk = await reader.read()
            done = chunk.done
            body += textDecoder.decode(chunk.value, { stream: true })
          } while (!done)

          try {
            data = JSON.parse(body)
          } catch (e) {
            data = body
          }
        }

        // console.log(result.status, result.statusText, JSON.stringify(data,null,2), JSON.stringify(body,null,2))

        settle(resolve, reject, {
          config,
          request: config,
          data,
          headers: Array.from<[string, string]>(result.headers.entries()).reduce(
            (headers: { [key: string]: string }, [key, value]: [string, string]) => ({
              ...headers, [key]: value
            }), {}
          ),
          status: result.status,
          statusText: result.statusText
        })
      } catch (e) {
        console.error(e)
        settle(resolve, reject, { config, request: config, error: e, status: 421, statusText: `${e}` })
      }
    })
  }
}
