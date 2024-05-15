
export class PollManagerError extends Error {
  constructor (message?: string) {
    super(message ?? 'poll.management.unauthorized')
  }
}

export class PollManagerIncomplete extends PollManagerError {
  constructor (message?: string) {
    super(message ?? 'poll.manager.incomplete')
  }
}

export class PollTransitionError extends PollManagerError {
  constructor (message?: string) {
    super(message ?? 'poll.transition.wrong')
  }
}

export class ServiceError extends Error {
  constructor (message?: string) {
    super(message ?? 'service.error')
  }
}

export class ProofError extends Error {
  constructor (message?: string) {
    super(message ?? 'proof.failed')
  }
}
