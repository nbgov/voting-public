import { Context } from '../types'
import { GCM_WRAPPER_KEY_ALGORITHM, WRAPPED_PERFIX, WRAPPER_GCMKEY_PURPOSES } from './consts'
// import { ECDSA_ALGORITHM_FORWRAPPING, WRAPPER_KEY_ALGORITHM, WRAPPER_KEY_PURPOSES } from './consts'
import { DbSecurityHelper } from './types'

import crypto from 'crypto'

export const buildDbSecurityHelper = (context: Context): DbSecurityHelper => {

  const _getGCMWrapperKey = async (): Promise<[CryptoKey, Buffer]> => {
    const source = Buffer.from(context.config.wrapperGCMKey, 'base64')
    const iv = Uint8Array.prototype.slice.call(source, -12)
    const key = Uint8Array.prototype.slice.call(source, 0, -12)
    return [
      await crypto.subtle.importKey('raw', key, GCM_WRAPPER_KEY_ALGORITHM, true, WRAPPER_GCMKEY_PURPOSES),
      Buffer.from(iv)
    ]
  }

  // const _getWrapperKey = async (): Promise<CryptoKey> => {
  //   return await crypto.subtle.importKey(
  //     'raw', Buffer.from(context.config.wrapperKey, 'base64'), WRAPPER_KEY_ALGORITHM, true, WRAPPER_KEY_PURPOSES
  //   )
  // }

  const _helper: DbSecurityHelper = {
    encryptSecretKey: async key => {
      if (typeof key === 'string') {
        key = Buffer.from(key, 'hex')
      }

      const [wrapperKey, iv] = await _getGCMWrapperKey()
      const wrappedKey = await crypto.subtle.encrypt(
        { ...GCM_WRAPPER_KEY_ALGORITHM, iv }, wrapperKey, key
      )

      return WRAPPED_PERFIX + Buffer.from(wrappedKey).toString('hex')
    },

    decryptSecretKey: async encryptedKey => {
      if (!encryptedKey.startsWith(WRAPPED_PERFIX)) {
        return Buffer.from(encryptedKey, 'hex')
        // @TODO This is done for testing purpose only. Just return buffer from hex if the key is unwrapped
        // encryptedKey = await _helper.encryptSecretBBSKey(encryptedKey)
      }

      const [, _encryptedKey] = encryptedKey.split(':', 2)

      const [wrapperKey, iv] = await _getGCMWrapperKey()

      return Buffer.from(await crypto.subtle.decrypt(
        { ...GCM_WRAPPER_KEY_ALGORITHM, iv }, wrapperKey, Buffer.from(_encryptedKey, 'hex')
      ))
    },

    // encryptSecretKey: async key => {
    //   if (typeof key === 'string') {
    //     key = Buffer.from(key, 'hex')
    //   }

    //   const exportedKey = await crypto.subtle.importKey(
    //     'raw', key, ECDSA_ALGORITHM_FORWRAPPING, true, WRAPPER_KEY_PURPOSES
    //   )
    //   const wrappedKey = await crypto.subtle.wrapKey(
    //     'raw', exportedKey, await _getWrapperKey(), WRAPPER_KEY_ALGORITHM
    //   )

    //   return WRAPPED_PERFIX + Buffer.from(wrappedKey).toString('hex')
    // },

    // decryptSecretKey: async encryptedKey => {
    //   if (!encryptedKey.startsWith(WRAPPED_PERFIX)) {
    //     return Buffer.from(encryptedKey, 'hex')
    //   }

    //   const [, _encryptedKey] = encryptedKey.split(':', 2)
    //   const key = await crypto.subtle.unwrapKey(
    //     'raw', Buffer.from(_encryptedKey, 'hex'), await _getWrapperKey(),
    //     WRAPPER_KEY_ALGORITHM, ECDSA_ALGORITHM_FORWRAPPING, true, WRAPPER_KEY_PURPOSES
    //   )

    //   return Buffer.from(await crypto.subtle.exportKey('raw', key))
    // }
  }

  return _helper
}
