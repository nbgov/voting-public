
export class AuhtorizationError extends Error {
  constructor (message?: string) {
    super(message ?? 'unauthorized')
  }
}

export class MalformedError extends Error {
  constructor (message?: string) {
    super(message ?? 'malformed')
  }
}

export class SequenceError extends Error {
  constructor (message?: string) {
    super(message ?? 'action.sequence')
  }
}
