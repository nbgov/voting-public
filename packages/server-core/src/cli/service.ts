import type { CommandModule } from 'yargs'
import { createCommand } from './service/create'

export const serviceCommand: CommandModule = {
  command: 'service',
  describe: 'manage integrated services',
  builder: yargs =>
    yargs.command(createCommand as CommandModule),
  handler: _ => { }
}
