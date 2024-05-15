// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./global.d.ts" />
import type { CommandModule } from 'yargs'
import yargs from 'yargs/yargs'
import { hideBin } from 'yargs/helpers'
import { serveCommand } from './cli/serve'
import { kickoffCommand } from './cli/kickoff'
import { discoverCommand } from './cli/discover'
import { userCommand } from './cli/user'
import { serviceCommand } from './cli/service'
import { context } from './context'
import { newbelarusCommand } from './cli/newbelarus'
import { securityCommand } from './cli/security'

// eslint-disable-next-line @typescript-eslint/no-floating-promises
yargs(hideBin(process.argv))
  .command(serveCommand)
  .command(discoverCommand)
  .command(userCommand)
  .command(serviceCommand)
  .command(newbelarusCommand)
  .command(securityCommand)
  .command(kickoffCommand as CommandModule)
  .showHelpOnFail(true)
  .help()
  .parse(hideBin(process.argv), { context })
