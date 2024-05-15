import { Wallet } from '@ethersproject/wallet'
import { EnvOptions, VocdoniSDKClient } from '@vocdoni/sdk'
import { type CommonModule } from '../../types'

export const createAccountCommand: DiscoverAccountCreateCommandModule = {
  command: 'create-account',
  describe: 'create new Vocdony Account',
  builder: yargs => yargs.option('json', {
    alias: 'j',
    default: false,
    describe: 'Should we output json',
    type: 'boolean'
  }),
  handler: async ({ json }) => {
    const wallet = Wallet.createRandom()
    const client = new VocdoniSDKClient({ env: EnvOptions.DEV, wallet })

    const info = await client.createAccount()

    if (json) {
      console.info(JSON.stringify({
        wallet: {
          mnemonic: wallet.mnemonic.phrase,
          path: wallet.mnemonic.path,
          locale: wallet.mnemonic.locale,
          pk: wallet.privateKey,
          pub: wallet.publicKey,
          address: wallet.address
        },
        info
      }, undefined, 2))
    } else {
      console.info('New Eth account is created:')
      console.info(`Mnemonic phrase: ${wallet.mnemonic.phrase}`)
      console.info(`Mnemonic path: ${wallet.mnemonic.path}`)
      console.info(`Mnemonic locale: ${wallet.mnemonic.locale}`)
      console.info(`Private key: ${wallet.privateKey}`)
      console.info(`Public key: ${wallet.publicKey}`)
      console.info(`Wallet address: ${wallet.address}`)
      console.info(`Info url: ${info.infoURL ?? 'NO URL'}`)
    }
  }
}

export interface DiscoverAccountCreateCommandModule extends CommonModule<{ json: boolean }> { }
