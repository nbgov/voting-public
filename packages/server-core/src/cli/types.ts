import type { CommandModule } from 'yargs'
import { type Context } from '../types'

export interface CommonModuleArgs { context: Context }

export interface CommonModule<
  Next = unknown,
  Prev extends CommonModuleArgs = CommonModuleArgs,
> extends CommandModule<Prev, Prev & Next> { }
