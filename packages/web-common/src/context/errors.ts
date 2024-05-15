import { LocalizedError } from '@smartapps-poll/common'

export class UnauthenticatedError extends LocalizedError {
  constructor (message?: string) {
    super(message ?? 'web.unauthenticated')
  }
}
