import fs from 'fs'
import path from 'path'

import { describe, it } from '@jest/globals'
import { HDNodeWallet, hexlify, keccak256 } from 'ethers'
import { getWalletUtils } from '@smartapps-poll/common'

import '../../src/config'
import { blind, blindSign, newRequestParameters, pointFromHex, pointToHex, unblind, verify } from 'blindsecp256k1'
import BigInteger from 'bigi'
import { strip0x } from '@vocdoni/sdk'

import { Point, getCurveByName } from 'ecurve'

const walletPath = path.resolve(__dirname, '../../tmp/', 'wallet.txt')

describe('secp256k1 blind cryptography', () => {
  it('blinds and verifies full cycle', async () => {
    const utils = getWalletUtils()

    let secpWallet: HDNodeWallet
    if (fs.existsSync(walletPath)) {
      secpWallet = utils.fromEncryptedJsonSync(fs.readFileSync(walletPath).toString(), '111111') as HDNodeWallet
    } else {
      secpWallet = utils.createRandom()
      fs.writeFileSync(walletPath, secpWallet.encryptSync('111111'))
    }

    const requestPair = newRequestParameters()

    const hash = strip0x(keccak256(hexlify(Buffer.from('xxxx', 'utf8'))))

    const { mBlinded, userSecretData } = blind(BigInteger.fromHex(hash), pointFromHex(pointToHex(requestPair.signerR)))

    const blindPrivKey = BigInteger.fromHex(strip0x(secpWallet.privateKey))

    const blinded = blindSign(blindPrivKey, mBlinded, BigInteger.fromHex(requestPair.k.toString(16)))

    const unblinded = unblind(BigInteger.fromHex(blinded.toString(16)), userSecretData)

    const pub = Point.decodeFrom(getCurveByName('secp256k1'), Buffer.from(strip0x(secpWallet.publicKey), 'hex'))

    console.log(verify(
      BigInteger.fromHex(hash),
      unblinded,
      pub
    ))
  })
})
