
export class IntegrationError extends Error {
  constructor (message?: string) {
    super(message ?? 'integration.unknown')
  }
}

export class CensusError extends Error {
  constructor (message?: string) {
    super(message ?? 'census.unknown')
  }
}

export class CensusRegistration extends CensusError {
  constructor (message?: string) {
    super(message ?? 'census.registration')
  }
}

export class ProofspaceError extends Error {
  constructor (message?: string) {
    super(message ?? 'proofspace.failed')
  }
}

export class NewBelarusError extends Error {
  constructor (message?: string) {
    super(message ?? 'newbelarus.failed')
  }
}

export class AuthError extends Error {
  constructor (message?: string) {
    super(message ?? 'auth.failed')
  }
}

export class TelegramError extends Error {
  constructor(message?: string) {
    super(message ?? 'telegram.error')
  }
}
