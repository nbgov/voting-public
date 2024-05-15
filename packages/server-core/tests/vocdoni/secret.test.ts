import { describe, expect, it } from '@jest/globals'
import { getWalletUtils } from '@smartapps-poll/common'
import { Account, CspCensus, Election, ElectionStatus, VocdoniSDKClient, Vote, strip0x } from '@vocdoni/sdk'

import { config } from '../../src/config'

import days from 'dayjs'
import fs from 'fs'
import path from 'path'
import { Wallet } from '@ethersproject/wallet'

import { newRequestParameters, pointToHex, signatureFromHex, verify } from 'blindsecp256k1'
import { HDNodeWallet, hexlify, keccak256 } from 'ethers'
import { Point, getCurveByName } from 'ecurve'
import BigInteger from 'bigi'

import { Vochain } from '@vocdoni/proto'

const walletPath = path.resolve(__dirname, '../../tmp/', 'wallet.txt')

const url = (
  config.url.startsWith('0.') ? 'http://localhost' : config.url
) + ':' + config.port.toString() + '/vocdoni-test/blind-csp'

describe('Vocdoni blind cryptography', () => {
  it('creates and executes voting', async () => {
    const utils = getWalletUtils()
    let serverWallet: HDNodeWallet
    if (fs.existsSync(walletPath)) {
      serverWallet = utils.fromEncryptedJsonSync(fs.readFileSync(walletPath).toString(), '111111') as HDNodeWallet
    } else {
      serverWallet = utils.createRandom()
      fs.writeFileSync(walletPath, serverWallet.encryptSync('111111'))
    }

    const pub = Point.decodeFrom(getCurveByName('secp256k1'), Buffer.from(strip0x(serverWallet.publicKey), 'hex'))

    // const newServerWallet = newKeyPair()
    // console.log(newServerWallet.pk.getEncoded(false))
    // console.log(pointFromHex(pointToHex(newServerWallet.pk)))

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

    const params = newRequestParameters()

    const address = strip0x(await client.wallet?.getAddress() ?? '')

    console.log(await client.cspStep(0, [pointToHex(params.signerR), params.k.toString(16)]))

    const signResult = await client.cspSign(address, pointToHex(params.signerR))

    const vote = await client.cspVote(new Vote([0]), signResult)
    console.log(vote)

    const caBundle = Vochain.CAbundle.fromPartial({
      processId: new Uint8Array(Buffer.from(strip0x(id), 'hex')),
      address: new Uint8Array(Buffer.from(address, 'hex')),
    })
    const hexBundle = hexlify(Vochain.CAbundle.encode(caBundle).finish())

    console.log(verify(BigInteger.fromHex(strip0x(keccak256(hexBundle))), signatureFromHex(signResult), pub))

    console.log(await client.submitVote(vote))
  })
})
