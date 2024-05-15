import { LocalizedError } from '../../utils/errors'

export class PollError extends LocalizedError {
  constructor (message?: string) {
    super(message ?? 'poll.error')
  }
}

export class PollReadyError extends PollError {
  constructor (message?: string) {
    super(message ?? 'poll.ready.isnt')
  }
}

export class AccountBalanceError extends LocalizedError {
  constructor (message?: string) {
    super(message ?? 'account.balance.insufficient')
  }
}

export class VoteEmptyError extends PollError {
  constructor (message?: string) {
    super(message ?? 'vote.empty')
  }
}

export class VoteError extends PollError {
  constructor (message?: string) {
    super(message ?? 'vote.casted')
  }
}
