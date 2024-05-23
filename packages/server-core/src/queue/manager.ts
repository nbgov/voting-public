import { Queue, QueueEvents, Worker } from 'bullmq'
import type { Context } from '../types'
import type { JobProcessor, QueueManager, QueueWrapper } from './types'
import { PREFIX, queueOptions } from './consts'
import { createRedis } from '../model/redis'

export const createQueue = (context: Context): QueueManager => {
  const _queues: { [queue: string]: Queue } = {}
  const _workers: { [queue: string]: Worker } = {}
  const _wrappers: { [queue: string]: QueueWrapper } = {}
  const _events: { [queue: string]: QueueEvents } = {}
  const _listeneres: { [queue: string]: { [job: string]: JobProcessor } } = {}
  const _qn = (queue: string) => `${PREFIX}:${queue}`
  const _perfix = (queue: string) => `{${PREFIX}:${queue}}`
  const _manager: QueueManager = {
    close: async () => {
      await Promise.all(Object.entries(_events).map(([, processor]) => processor.close()))
      await Promise.all(Object.entries(_workers).map(([, worker]) => worker.close()))
      await Promise.all(Object.entries(_queues).map(([, queue]) => queue.close()))
    },

    get: (queue) => {
      if (_wrappers[queue] == null) {
        const connection = createRedis(context, { maxRetriesPerRequest: null });
        _queues[queue] = new Queue(_qn(queue), { connection, prefix: _perfix(queue) })
        _wrappers[queue] = {
          add: async (name, data, opts) => {
            opts = {
              removeOnComplete: { age: 30 }, removeOnFail: { age: 30 }, ...opts
            }
            context.config.devMode && console.log(`Start job ${name} with options`, opts)
            return _queues[queue].add(name, data, opts)
          },

          wait: async (name, data, opts) => {
            const job = await _wrappers[queue].add(name, data, opts)

            if (_events[queue] == null) {
              _events[queue] = new QueueEvents(_qn(queue), { connection: await _queues[queue].client, prefix: _perfix(queue) })
              await _events[queue].waitUntilReady()
            }

            return await job.waitUntilFinished(_events[queue])
          }
        }
      }

      return _wrappers[queue]
    },

    listen: (queue, job, listner, opts) => {
      if (_workers[queue] == null) {
        const connection = createRedis(context, { maxRetriesPerRequest: null })
        _workers[queue] = new Worker(_qn(queue), async job => {
          context.config.devMode && console.log(`Try: ${queue}:${job.name}`)
          return _listeneres[queue][job.name](job)
        }, { connection, prefix: _perfix(queue), ...(queueOptions[queue] ?? {}), ...opts })
        _listeneres[queue] = {}
      }
      _listeneres[queue][job] = listner

      return _workers[queue]
    },

    removeRepeatable: async (queue, job, opts) => {
      _manager.get(queue)
      await _queues[queue].client
      await _queues[queue].removeRepeatable(job, opts)
    }
  }

  return context.queue = _manager
}
