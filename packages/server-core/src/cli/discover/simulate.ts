import { Wallet } from '@ethersproject/wallet'
import { Election, EnvOptions, PlainCensus, type UnpublishedElection, VocdoniSDKClient, Vote } from '@vocdoni/sdk'
import { type CommandModule } from 'yargs'

export const simulateCommand: CommandModule = {
  command: 'simulate',
  describe: 'simulate voting process',
  handler: async () => {
    const wallet = Wallet.createRandom()
    const creator = new VocdoniSDKClient({ env: EnvOptions.DEV, wallet })
    await creator.createAccount()

    const info = await creator.fetchAccount()
    console.info({
      address: info.address,
      balance: info.balance
    })
    if (info.balance > 0) {
      const voter = Wallet.createRandom()
      const census = new PlainCensus()
      census.add(await voter.getAddress())
      census.add(await Wallet.createRandom().getAddress())
      const endDate = new Date()
      endDate.setHours(endDate.getHours() + 10)
      const election: UnpublishedElection = Election.from({
        title: 'Election title',
        description: 'Election description',
        header: 'https://source.unsplash.com/random',
        streamUri: 'https://source.unsplash.com/random',
        endDate: endDate.getTime(),
        census
      })

      election.addQuestion('This is a title', 'This is a description', [
        {
          title: 'Option 1',
          value: 0
        },
        {
          title: 'Option 2',
          value: 1
        }
      ])

      const electionId = await creator.createElection(election)
      console.info(`Election created: ${electionId}`)
      const info0 = await creator.fetchAccount()
      console.info(`Balance after election is created: ${info0.balance}`)

      await new Promise(resolve => setTimeout(resolve, 14000))

      const client = new VocdoniSDKClient({ env: EnvOptions.DEV, wallet: voter })
      await client.createAccount()
      const clientInfo = await client.fetchAccount()
      console.info(`Client balance before vote: ${clientInfo.balance}`)
      client.setElectionId(electionId)

      await client.submitVote(new Vote([1]))
      await new Promise(resolve => setTimeout(resolve, 14000))

      const clientInfo0 = await client.fetchAccount()
      console.info(`Client balance after vote: ${clientInfo0.balance}`)

      const info1 = await creator.fetchAccount()
      console.info(`Balance after voit is sent: ${info1.balance}`)

      await creator.endElection(electionId)
      const result = await creator.fetchElection(electionId)
      console.info(result)
    }
  }
}
