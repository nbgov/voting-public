import { LocalizedError } from '@smartapps-poll/common'

export class IntegrationError extends LocalizedError {
  constructor (msg?: string) {
    super(msg ?? 'integration.general')
  }
}

export class IntegrationUnauthorizedError extends IntegrationError {
  constructor (msg?: string) {
    super(msg ?? 'integration.unauthorized')
  }
}
