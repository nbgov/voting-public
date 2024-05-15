import { ServiceStartegyImplError } from '@smartapps-poll/common'
import { VOCDONI_STARTEGY } from './consts'

export class VocdoniImplError extends ServiceStartegyImplError {
  constructor (method: string) {
    super(VOCDONI_STARTEGY, method)
  }
}

export class VocdoniSyntaxError extends Error {
  constructor (message?: string) {
    super(message ?? 'vocdoni.use.incorrect')
  }
}
