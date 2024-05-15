import type { Job, JobsOptions, Worker, WorkerOptions } from 'bullmq'
import { Context } from '../types'

export interface QueueManager {
  close: () => Promise<void>
  get: <Type, Result = unknown>(queue: string) => QueueWrapper<Type, Result>
  listen: <Type, Result>(queue: string, job: string, listner: JobProcessor, opts?: Partial<WorkerOptions>) => Worker<Type, Result>
  removeRepeatable: (queue: string, job: string, opts: Partial<JobsOptions>) => Promise<void>
  remote: {
    get: <Type, Result = unknown>() => QueueWrapper<Type, Result>
    listen: <Type, Result>(job: string, listner: JobProcessor) => Worker<Type, Result>
  },
  db: {
    get: <Type, Result = unknown>() => QueueWrapper<Type, Result>
    listen: <Type, Result>(job: string, listner: JobProcessor) => Worker<Type, Result>
  },
  algo: {
    get: <Type, Result = unknown>() => QueueWrapper<Type, Result>
    listen: <Type, Result>(job: string, listner: JobProcessor) => Worker<Type, Result>
  },
}

export interface QueueWrapper<Type = any, Result = any> {
  add: (name: string, data: Type, opts?: JobsOptions) => Promise<Job<Type, Result>>
  wait: (name: string, data?: Type, opts?: JobsOptions) => Promise<Result>
}

export interface JobProcessor<Type = any, Result = any> { (job: Job<Type, Result>): Promise<Result> }

export interface WaitMethod<Type = any, Result = any> { (data: Type): Promise<Result> }

export interface RepeatMethod<Type = any> { (data?: Type, frequency?: number): Promise<void> }

export interface WorkerHandler<Type = any, Result = any> {
  tags?: string[]
  name: string
  queue: string
  handler: JobProcessor<Type, Result>
  wait: WaitMethod<Type, Result>
  repeat?: RepeatMethod<Type>
}

export interface WorkerHandlerWithCtx<Type = any, Result = any> {
  (context: Context): WorkerHandler<Type, Result>
}
