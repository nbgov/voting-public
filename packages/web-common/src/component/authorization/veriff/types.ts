import { FC } from 'react'

export interface VeriffInitializationHandler {
  trigger?: () => Promise<void>
}

export interface VeriffAuthorizationCom extends FC<{
  pollId: string
  handler: VeriffInitializationHandler
  success: () => Promise<void>
  failure: ((e: Error) => Promise<void>) | (() => Promise<void>)
}> { }
