import { describe, expect, it } from '@jest/globals'
import { getWalletUtils } from '@smartapps-poll/common'
import { Wallet } from '@ethersproject/wallet'
import { CspCensus, Election, PlainCensus, VocdoniSDKClient, strip0x } from '@vocdoni/sdk'

import { config } from '../../src/config'
import days from 'dayjs'

const url = (
  config.url.startsWith('0.') ? 'http://localhost' : config.url
) /*+ ':' + config.port.toString()*/ + '/vocdoni-test/blind-csp'

describe('Vocdoni blind cryptography', () => {
  it('estimates ecdsa based voting', async () => {
    const utils = getWalletUtils()
    const host = new VocdoniSDKClient({
      env: config.vocdoni.env, wallet: utils.createRandom() as unknown as Wallet
    })

    const serverWallet = utils.createRandom()

    const election = Election.from({
      title: 'Election T',
      electionType: { autoStart: true },
      startDate: new Date(),
      endDate: days(new Date()).add(1, 'hour').toDate(),
      census: new CspCensus(strip0x(serverWallet.publicKey), url),
      maxCensusSize: 10
    })

    election.addQuestion('Q1', '', [
      { title: 'O1', value: 0 },
      { title: 'O2', value: 1 }
    ])

    const cost = await host.estimateElectionCost(election)

    expect(cost).toBeGreaterThan(0)
  })

  it('estimates plain census based voting', async () => {
    const utils = getWalletUtils()
    const host = new VocdoniSDKClient({
      env: config.vocdoni.env, wallet: utils.createRandom() as unknown as Wallet
    })

    const census = new PlainCensus()

    const election = Election.from({
      title: 'Election T',
      electionType: { autoStart: true },
      startDate: new Date(),
      endDate: days(new Date()).add(1, 'hour').toDate(),
      census,
      maxCensusSize: 20
    })

    election.addQuestion('Q1', '', [
      { title: 'O1', value: 0 },
      { title: 'O2', value: 1 }
    ])

    const cost = await host.estimateElectionCost(election)

    expect(cost).toBeGreaterThan(0)
  })
})