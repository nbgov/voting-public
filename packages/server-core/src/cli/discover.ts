import { type CommandModule } from 'yargs'
import { createAccountCommand } from './discover/account/create'
import { simulateCommand } from './discover/simulate'

export const discoverCommand: CommandModule = {
  command: 'discover',
  describe: 'discover the capability of Vocdoni API',
  builder: yargs =>
    yargs.command(createAccountCommand as CommandModule)
      .command(simulateCommand),
  handler: _ => { }
}
