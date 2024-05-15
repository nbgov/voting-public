import { describe, expect, test } from '@jest/globals'
import http, { AxiosError } from 'axios'
import { constants as HTTP } from 'http2'
import { config } from '../src/config'

const url = config.url.startsWith('0.') ? 'http://localhost' : config.url

describe('REST API tests of dev server', () => {
  describe('hello', () => {
    test('open insecure', async () => {
      const result = await http.get(url + ':' + config.port.toString() + '/hello')
      expect(result.data).toEqual({ status: 'OK' })
    })

    test('open secure with failure', async () => {
      try {
        await http.get(url + ':' + config.port.toString() + `/hello-secured?token=no_token`)
      } catch (err) {
        expect((err as AxiosError).response?.status).toEqual(HTTP.HTTP_STATUS_UNAUTHORIZED)
      }
    })

    test('open secure with success', async () => {
      const result = await http.get(url + ':' + config.port.toString() + `/hello-secured?token=${config.test?.authToken}`)
      expect(result.data).toEqual({ status: 'OK' })
    })
  })
})