import { describe, expect, test } from '@jest/globals'
import { Account, CspCensus, Election, ElectionStatus, VocdoniSDKClient, Vote, strip0x, getBytes } from '@vocdoni/sdk'
import type { HDNodeWallet } from 'ethers'
import days from 'dayjs'
import fs from 'fs'
import path from 'path'

import { config } from '../../src/config'
import { getWalletUtils, hexlify, toKeccak256 } from '@smartapps-poll/common'
import type { Wallet } from '@ethersproject/wallet'
import { Vochain } from '@vocdoni/proto'

const url = (
  config.url.startsWith('0.') ? 'http://localhost' : config.url
) + ':' + config.port.toString() + '/vocdoni-test/csp'

const walletPath = path.resolve(__dirname, '../../tmp/', 'wallet.txt')

describe('Vocdoni CSP system', () => {
  test('creates and executes voting', async () => {

    const utils = getWalletUtils()

    const host = new VocdoniSDKClient({
      env: config.vocdoni.env, wallet: utils.createRandom() as unknown as Wallet
    })

    const client = new VocdoniSDKClient({
      env: config.vocdoni.env, wallet: utils.createRandom() as unknown as Wallet
    })

    let hostAccount = await host.createAccount({ account: new Account({}) })

    console.log((await host.fetchAccountInfo()).balance)

    await client.createAccount()

    if (hostAccount.balance === 0) {
      hostAccount = await host.collectFaucetTokens()
    }
    expect(hostAccount.balance).toBeGreaterThan(0)


    let serverWallet: HDNodeWallet;
    if (fs.existsSync(walletPath)) {
      serverWallet = utils.fromEncryptedJsonSync(fs.readFileSync(walletPath).toString(), '111111') as HDNodeWallet
    } else {
      serverWallet = utils.createRandom()
      fs.writeFileSync(walletPath, serverWallet.encryptSync('111111'))
    }

    const election = Election.from({
      title: 'Election T',
      electionType: { autoStart: true },
      startDate: new Date(),
      endDate: days(new Date()).add(1, 'hour').toDate(),
      census: new CspCensus(strip0x(serverWallet.publicKey), url),
      maxCensusSize: 1
    })

    election.addQuestion('Q1', '', [
      { title: 'O1', value: 0 },
      { title: 'O2', value: 1 }
    ])

    const id = await host.createElection(election)

    client.setElectionId(id)

    for (let i = 0; i < 10; ++i) {
      const status = (await client.fetchElection()).status;
      console.log(status)
      if (status === ElectionStatus.ONGOING) {
        break
      }
    }

    console.log(await client.cspStep(0, ['v1', 'v2']))

    const caBundle = Vochain.CAbundle.fromPartial({
      processId: new Uint8Array(Buffer.from(strip0x(id), 'hex')),
      address: new Uint8Array(Buffer.from(strip0x(await client.wallet?.getAddress() ?? ''), 'hex')),
    })

    const hexBundle = hexlify(Vochain.CAbundle.encode(caBundle).finish())
    // const hexHashBundle = toKeccak256(hexBundle)

    const { signature } = await client.cspStep(
      1, [{ payload: strip0x(hexBundle) }]
    ) as unknown as { signature: string }

    console.log('Signature comes: ', signature)

    const proof = Vochain.Proof.fromPartial({
      payload: {
        $case: 'ca',
        ca: Vochain.ProofCA.fromPartial({
          type: Vochain.ProofCA_Type.ECDSA,
          bundle: caBundle,
          signature: new Uint8Array(Buffer.from(strip0x(signature), 'hex'))
        })
      }
    })

    const vote = client.cspVote(new Vote([0]), strip0x(signature))

    const signTransaction = client.voteService.signTransaction

    client.voteService.signTransaction = async function (tx, message, wallet): Promise<string> {
      if (message.includes(strip0x(id))) {
        console.log('WE OVERRIDEN')
        const nonce = Buffer.from(strip0x(getHex()), 'hex');

        const pkg = {
          nonce: getHex().substring(2, 18),
          votes: vote.votes
        }

        const strPkg = JSON.stringify(pkg)

        const nullifier = new Uint8Array();

        const voteTx = Vochain.VoteEnvelope.fromPartial({
          proof,
          nonce: new Uint8Array(nonce),
          processId: new Uint8Array(Buffer.from(strip0x(id), 'hex')),
          votePackage: new Uint8Array(Buffer.from(strPkg)),
          nullifier
        })

        const tx = Vochain.Tx.encode({ payload: { $case: 'vote', vote: voteTx } }).finish()

        return signTransaction.apply(this, [tx, message, wallet])
      }

      return signTransaction.apply(this, [tx, message, wallet])
    }

    const voteId = await client.submitVote(vote)

    console.log('Final vote Id:', voteId)

    expect(typeof voteId === 'string').toBeTruthy()
  })
})

function getHex(): string {
  return toKeccak256('0x' + Buffer.from(getBytes(32)).toString('hex'));
}