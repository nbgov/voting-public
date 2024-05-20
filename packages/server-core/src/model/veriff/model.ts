import axios from 'axios'
import { Context } from '../../types'
import { VeriffNewSession, VeriffService } from './types'
import { signVeriffPayload } from './hmac-sign'

export const buildVeriffService: (ctx: Context) => VeriffService = ctx => ({
  deleteSession: async id => {
    const url = `${ctx.config.veriff.url}/v1/sessions/${id}`
    const headers = {
      'x-auth-client': ctx.config.veriff.key,
      'x-hmac-signature': signVeriffPayload(ctx.config.veriff.secret, id)
    }
    const response = await axios.delete(url, { headers })

    return response.status === 200
  },

  createSession: async customData => {
    const url = `${ctx.config.veriff.url}/v1/sessions`
    const payload = { verification: { vendorData: customData } }
    const _payload = JSON.stringify(payload)
    const headers = {
      'x-auth-client': ctx.config.veriff.key,
      'x-hmac-signature': signVeriffPayload(ctx.config.veriff.secret, _payload)
    }

    return (await axios.post<VeriffNewSession>(url, payload, { headers })).data
  }
})
