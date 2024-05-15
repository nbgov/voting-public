import { type VotingStrategy } from '@smartapps-poll/common'
import { type Context } from '../types'

export interface ServerStrategy extends VotingStrategy<Context> {
}
