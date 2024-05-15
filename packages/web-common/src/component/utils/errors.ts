
export class PollError extends Error {
  constructor (message?: string) {
    super(message ?? 'poll.unknown')
  }
}
