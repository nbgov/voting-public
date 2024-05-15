import type { CommandModule } from 'yargs'
import { keyCommand } from './security/key'

export const securityCommand: CommandModule = {
  command: 'security',
  describe: 'security related utils',
  builder: yargs =>
    yargs.command(keyCommand as CommandModule),
  handler: _ => { }
}
