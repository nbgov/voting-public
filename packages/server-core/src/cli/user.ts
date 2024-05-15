import { type CommandModule } from 'yargs'
import { createCommand } from './user/create'

export const userCommand: CommandModule = {
  command: 'user',
  describe: 'manage users',
  builder: yargs =>
    yargs.command(createCommand as CommandModule),
  handler: _ => { }
}
