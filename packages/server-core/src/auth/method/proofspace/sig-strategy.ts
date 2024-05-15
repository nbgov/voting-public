import type { Request } from 'express'
import type { PsHookRequest } from '@smartapps-poll/common'
import { AUTH_PS_PUBNAME_PARAM, type PsAuthCallback } from './types'
import { constants as HTTP } from 'http2'
import { Strategy } from 'passport-strategy'
import { createVerify } from 'crypto'
import { proofspacePubKeyRequest } from '../../../model/proofspace/pubkey'
import { deserializeError } from '../../../queue/utils'

export class PsSigStrategy extends Strategy {
  public name?: string

  private readonly _pubKeySource?: string

  private readonly _pubKey?: string

  private readonly _defaultKeyName: string

  private readonly _defaultServiceId: string

  private readonly _callback: PsAuthCallback

  constructor(callaback: PsAuthCallback, options: PsSigOptions) {
    super()
    this.name = 'ps-sig'
    this._callback = callaback
    this._defaultServiceId = options.defaultServiceId ?? ''
    this._defaultKeyName = options.defaultKeyName ?? 'default'
    this._pubKeySource = options.pubKeySource
    this._pubKey = options.pubKey
    if (this._pubKeySource === undefined && this._pubKey === undefined) {
      throw new TypeError('PsSigStrategy requires pub key or pub key sourece')
    }
  }

  async _authenticateWithPubKey(req: Request, pubKey: string): Promise<void> {
    const verifier = createVerify('sha3-256')
    verifier.update(JSON.stringify(req.body))
    const result = verifier.verify(pubKey, req.header('X-Body-Signature') ?? '', 'base64')
    if (result) {
      try {
        await this._callback(req, (err, user) => {
          const request: PsHookRequest = req.body
          if (err != null) {
            this.error(err)
          } else if (user?._id !== undefined) {
            user._payload = {
              serviceDid: request.publicServiceDid,
              subscriberConnectDid: request.subscriberConnectDid,
              actionEventId: request.actionEventId,
              ...user._payload,
              ok: true
            }
            this.success(user)
          } else {
            this.fail({ ok: false, error: { messege: 'user.no' } }, HTTP.HTTP_STATUS_BAD_REQUEST)
          }
        })
      } catch (e) {
        this.error(e as Error)
      }
    } else {
      this.fail({ ok: false, error: { messege: 'signature.failed' } }, HTTP.HTTP_STATUS_BAD_REQUEST)
    }
  }

  /**
   * @remote ✅
   */
  authenticate(req: Request): void {
    const request: PsHookRequest = req.body
    if (this._pubKeySource !== undefined) {
      proofspacePubKeyRequest(req.context).wait({
        pattern: this._pubKeySource,
        did: request.publicServiceDid ?? this._defaultServiceId,
        key: request.actionParams.find(param => param.name === AUTH_PS_PUBNAME_PARAM)?.value ?? this._defaultKeyName
      }).then(res => {
        void this._authenticateWithPubKey(req, res.publicKey)
      }).catch(deserializeError)
    } else if (this._pubKey !== undefined) {
      void this._authenticateWithPubKey(req, this._pubKey)
    }
  }
}

export interface PsSigOptions extends Record<string, any> {
  pubKeySource?: string
  pubKey?: string
  defaultKeyName?: string
  defaultServiceId?: string
}
