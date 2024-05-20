import { AxiosError } from 'axios'
import { AuthError, CensusRegistration, IntegrationError, NewBelarusError, ProofspaceError, VeriffError } from '../model/errors'
import { PollError } from '@smartapps-poll/common'
import { AuhtorizationError, MalformedError } from '../routes/errors'
import type { Context } from '../types'
import type { WaitMethod } from './types'
import type { JobsOptions } from 'bullmq'
import { ProofError } from '../resources/errors'

export const serializeError = (e: unknown): never => {
  // console.log(new Error().stack)
  // console.error(e)
  // console.log((e as any)?.message)
  // console.log((e as any)?.stack)
  if (e instanceof IntegrationError) {
    throw new Error(`integration:${e.message}`)
  } else if (e instanceof CensusRegistration) {
    throw new Error(`census.registration:${e.message}`)
  } else if (e instanceof AuhtorizationError) {
    throw new Error(`authorization:${e.message}`)
  } else if (e instanceof MalformedError) {
    throw new Error(`malformed:${e.message}`)
  } else if (e instanceof PollError) {
    throw new Error(`poll:${e.message}`)
  } else if (e instanceof ProofError) {
    throw new Error(`proof:${e.message}`)
  } else if (e instanceof AuthError) {
    throw new Error(`auth:${e.message}`)
  } else if (e instanceof NewBelarusError) {
    throw new Error(`newbelarus:${e.message}`)
  } else if (e instanceof ProofspaceError) {
    throw new Error(`proofspace:${e.message}`)
  } else if (e instanceof AxiosError) {
    throw new Error(`axios:${e.message}`)
  } else if (e instanceof VeriffError) {
    throw new Error(`veriff:${e.message}`)
  } else if (e instanceof Error) {
    throw new Error(`${e.name}:${e.message}`)
  } else {
    throw e
  }
}

const _splitError = (e: unknown): string[] => {
  if (e instanceof Error) {
    return e.message.split(':', 2)
  }
  return []
}

export const deserializeError = (e: unknown): never => {
  const info = _splitError(e)
  if (e instanceof Error && info.length === 2) {
    switch (info[0]) {
      case 'integration':
        throw new IntegrationError(info[1])
      case 'census.registration':
        throw new CensusRegistration(info[1])
      case 'authoriszation':
        throw new AuhtorizationError(info[1])
      case 'malformed':
        throw new MalformedError(info[1])
      case 'poll':
        throw new PollError(info[1])
      case 'proof':
        throw new ProofError(info[1])
      case 'auth':
        throw new AuthError(info[1])
      case 'newbelarus':
        throw new NewBelarusError(info[1])
      case 'proofspace':
        throw new ProofspaceError(info[1])
      case 'axios':
        throw new AxiosError(info[1])
      case 'veriff':
        throw new VeriffError(info[1])
    }
  }
  if (e instanceof Error) {
    console.debug(`Pay attention to unprocessed error type in integration: ${e.message}`)
  }
  throw e
}

export const stabWaitMethod: WaitMethod = async () => { }

export const makeWaitMethod = <Type, Result = unknown>(ctx: Context, queue: string, name: string, opts?: JobsOptions) =>
  async (data: Type): Promise<Result> => {
    try {
      return await ctx.queue.get<Type, Result>(queue).wait(name, data, opts)
    } catch (e) {
      deserializeError(e)
      throw e // This won't actually work it just to fool linter
    }
  }

const _repeated: { [queue: string]: string[] } = {}

export const makeRepeatMethod = <Type>(ctx: Context, queue: string, name: string, frequency?: number, opts?: JobsOptions) =>
  async (data: Type, _frequency?: number): Promise<void> => {
    frequency = _frequency ?? frequency
    if (_repeated[queue] == null) {
      _repeated[queue] = []
    } else if (_repeated[queue].includes(name)) {
      return
    }
    _repeated[queue].push(name)
    try {
      opts = opts ?? {
        removeOnComplete: undefined,
        removeOnFail: undefined
      }
      opts.repeat = opts.repeat?.every || opts.repeat?.pattern ? opts.repeat : {
        every: (frequency ?? 300) * 1000
      }
      await ctx.queue.removeRepeatable(queue, name, opts)
      await ctx.queue.get<Type>(queue).add(name, data, opts)
    } catch (e) {
      deserializeError(e)
    }
  }
