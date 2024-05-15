import type { CommandModule } from 'yargs'
import { createAuth } from '../auth/create'
import { createRouter } from '../router'
import { createServer } from '../server/create'
import { type Context } from '../types'
import { initializeWasm } from '@docknetwork/crypto-wasm-ts'
import { createRedis } from '../model/redis'
import { createQueue } from '../queue/manager'
import { registerAllWorkers } from '../queue'


export const serveCommand: CommandModule = {
  command: 'serve',
  describe: 'start the server',
  handler: async argv => {
    await initializeWasm()
    const context: Context = argv.context as Context
    context.redis = createRedis(context)
    if (context.config.redisCluster != null)  {
      console.info('! Use redis cluster !')
    }
    createQueue(context)
    registerAllWorkers(context)
    const auth = createAuth(context)
    const server = createServer(context)
    server.inject(context)
    server.plugin(auth.plugin())
    server.router(createRouter(auth))
    server.start()
  }
}
