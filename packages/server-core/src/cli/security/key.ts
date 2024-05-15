import { GCM_WRAPPER_KEY_ALGORITHM, WRAPPER_GCMKEY_PURPOSES } from '../../db/consts'
import { CommonModule } from '../types'
import crypto from 'crypto'
import { generateKeyPairSync } from 'node:crypto'

export const keyCommand: SecurityKeyCommandModule = {
  command: 'key',
  describe: 'create a key for encryption algorithms',
  builder: yargs => yargs.options('type', {
    'alias': 't',
    'type': 'string',
    'default': 'gcm',
    'describe': 'Purpose of key: gcm — universal key encryption',
    'choices': ['gcm', 'x25519']
  }),
  handler: async ({ type, context: _context }) => {
    switch (type) {
      case 'gcm': {
        const iv = crypto.randomBytes(12)
        const key = await crypto.subtle.generateKey(
          GCM_WRAPPER_KEY_ALGORITHM, true, WRAPPER_GCMKEY_PURPOSES
        )
        console.info(Buffer.from(
          Buffer.concat([Buffer.from(await crypto.subtle.exportKey('raw', key)), iv])
        ).toString('base64'))
        break
      }
      case 'x25519': {
        const { privateKey, publicKey } = generateKeyPairSync('x25519', {
          privateKeyEncoding: { type: 'pkcs8', format: 'der' },
          publicKeyEncoding: { type: 'spki', format: 'der' },
        })

        console.info('Privte key: ' + privateKey.toString('base64'))
        console.info('Public key: ' + publicKey.toString('base64'))
      }
    }
  }
}

export interface SecurityKeyCommandModule extends CommonModule<{
  type?: string
}> { }
