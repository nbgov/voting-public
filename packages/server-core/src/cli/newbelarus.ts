import type { CommandModule } from 'yargs'
import { passportCommand } from './newbelarus/passport'
import { telegramCommand } from './newbelarus/telegram'

export const newbelarusCommand: CommandModule = {
  command: 'newbelarus',
  describe: 'manage newbelarus related decentralized services',
  builder: yargs =>
    yargs.command(passportCommand as CommandModule)
      .command(telegramCommand as CommandModule),
  handler: _ => { }
}
