import { toBase64 } from '@smartapps-poll/common'
import type { EnvOptions, VocdoniSDKClient } from '@vocdoni/sdk'
import type { PartialCommonContext } from '../../context'
import type { VocdoniService } from './types'
import { vocdoniCryptoHelper } from './crypto'

export const createVocdoniService = (context: PartialCommonContext): VocdoniService => {
  let _walletSecret: string = ''

  let _client: VocdoniSDKClient | undefined

  const _service: VocdoniService = {
    get client() {
      if (_client == null) {
        const config = context.getApiConfiguration()
        const env = config.vocdoni?.env ?? 'stg' as EnvOptions
        _client = vocdoniCryptoHelper.createSDK({ env })
      }

      return _client
    },

    wallet: () => _service.client.wallet as any,

    encrypt: async secret => toBase64(await _service.wallet().encrypt(secret ?? _walletSecret)),

    setWallet: wallet => {
      _service.client.wallet = wallet as any
    },

    setSecret: secret => {
      _walletSecret = secret
    },

    account: {
      create: async (account, wallet) => {
        if (wallet != null) {
          _service.client.wallet = wallet as any
        }
        const entity = vocdoniCryptoHelper.createAccount(account)
        const data = await _service.client.createAccount({ account: entity })

        return data
      },

      fetchEntity: async (wallet) => {
        _service.account.entity = undefined
        const info = await _service.account.fetch(wallet)
        _service.account.entity = vocdoniCryptoHelper.createAccount((info as any).metadata)

        return _service.account.entity
      },

      fetch: async (wallet) => {
        if (wallet != null) {
          _service.client.wallet = wallet as any
        }
        const info = await _service.client.fetchAccount()// fetchAccountInfo()

        return info
      }
    }
  }

  return _service
}
