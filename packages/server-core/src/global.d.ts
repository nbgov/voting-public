import type { Context } from './types'
import type { User as CommonUser } from '@smartapps-poll/common'

declare global {
  namespace Express {
    export interface Request {
      context: Context
    }
    export interface User extends CommonUser {}
  }
}

export { }
