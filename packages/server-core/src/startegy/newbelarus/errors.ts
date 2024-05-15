import { CredsStartegyImplError, NEWBELARUS_STRATEGY } from '@smartapps-poll/common'

export class NewBelarusCredsImplError extends CredsStartegyImplError {
  constructor (method: string) {
    super(NEWBELARUS_STRATEGY, method)
  }
}
