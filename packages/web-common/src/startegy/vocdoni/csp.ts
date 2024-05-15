import { type Poll, hexlify, toKeccak256, VOCDONI_CENSUS_CSP_NBNS, VOCDONI_CENSUS_CSP_BLINDNS } from '@smartapps-poll/common'
import { Vochain } from '@vocdoni/proto'
import { type VocdoniSDKClient } from '@vocdoni/sdk'
import { Buffer } from 'buffer'
import { vocdoniCryptoHelper } from '../../service'
import { Asymmetric } from './asymmertic'


export const cspService = {
  createCABundle: (id: string, address: string) => {
    return Vochain.CAbundle.fromPartial({
      processId: new Uint8Array(Buffer.from(vocdoniCryptoHelper.strip0x(id), 'hex')),
      address: new Uint8Array(Buffer.from(vocdoniCryptoHelper.strip0x(address), 'hex'))
    })
  },

  packCABundle: (bundle: ReturnType<typeof Vochain.CAbundle.fromPartial>) => {
    return hexlify(Vochain.CAbundle.encode(bundle).finish())
  },

  createECDSAProof: (signature: string, bundle: ReturnType<typeof Vochain.CAbundle.fromPartial>) => {
    return Vochain.Proof.fromPartial({
      payload: {
        $case: 'ca',
        ca: Vochain.ProofCA.fromPartial({
          bundle,
          type: Vochain.ProofCA_Type.ECDSA,
          signature: new Uint8Array(Buffer.from(vocdoniCryptoHelper.strip0x(signature), 'hex'))
        })
      }
    })
  },

  createBlindProof: (signature: string, bundle: ReturnType<typeof Vochain.CAbundle.fromPartial>) => {
    return Vochain.Proof.fromPartial({
      payload: {
        $case: 'ca',
        ca: Vochain.ProofCA.fromPartial({
          bundle,
          type: Vochain.ProofCA_Type.ECDSA_BLIND,
          signature: new Uint8Array(Buffer.from(vocdoniCryptoHelper.strip0x(signature), 'hex'))
        })
      }
    })
  },

  submitVote: async (
    client: VocdoniSDKClient,
    poll: Poll,
    { address, answers, signature }: { address: string, answers: number[], signature: string }
  ) => {
    const caBundle = cspService.createCABundle(poll.externalId ?? '', address)
    const vote = client.cspVote(
      vocdoniCryptoHelper.createVote(answers),
      vocdoniCryptoHelper.strip0x(signature)
    )
    let proof: ReturnType<typeof cspService.createECDSAProof>
    switch (poll.census.type) {
      case VOCDONI_CENSUS_CSP_NBNS: {
        proof = cspService.createECDSAProof(signature, caBundle)
        break
      }
      default:
      case VOCDONI_CENSUS_CSP_BLINDNS: {
        proof = cspService.createBlindProof(signature, caBundle)
        break
      }
    }

    const signTransaction = client.voteService.signTransaction
    client.voteService.signTransaction = async function (tx, message, wallet): Promise<string> {
      const _tx = Vochain.Tx.decode(tx)
      if (_tx.payload?.$case === 'vote') {
        if (vocdoniCryptoHelper.strip0x(hexlify(_tx.payload.vote.processId)) === poll.externalId) {
          const nonce = Buffer.from(vocdoniCryptoHelper.strip0x(getHex()), 'hex')

          const election = await client.fetchElection(poll.externalId ?? '')
          const isSecret = election?.electionType.secretUntilTheEnd != null && election.electionType.secretUntilTheEnd

          const pkg = { nonce: getHex().substring(2, 18), votes: vote.votes }
          const strPkg = JSON.stringify(pkg)
          const encryptionKeyIndexes: number[] = []
          let votePackage: Buffer
          if (isSecret) {
            const publicKeys: string[] = []
            const electionKeys = await client.electionService.keys(election.id)
            electionKeys.publicKeys.forEach((entry) => {
              publicKeys.push(vocdoniCryptoHelper.strip0x(entry.key))
              encryptionKeyIndexes.push(entry.index)
            })
            votePackage = Asymmetric.encryptRaw(Buffer.from(strPkg), publicKeys[0], vocdoniCryptoHelper)
            for (let i = 1; i < publicKeys.length; i++) {
              votePackage = Asymmetric.encryptRaw(votePackage, publicKeys[i], vocdoniCryptoHelper)
            }
          } else {
            votePackage = Buffer.from(strPkg)
          }

          const nullifier = new Uint8Array()

          const voteTx = Vochain.VoteEnvelope.fromPartial({
            proof,
            nonce: new Uint8Array(nonce),
            processId: new Uint8Array(Buffer.from(vocdoniCryptoHelper.strip0x(poll.externalId), 'hex')),
            votePackage: new Uint8Array(votePackage),
            ...(isSecret ? { encryptionKeyIndexes } : {}),
            nullifier
          })

          const tx = Vochain.Tx.encode({ payload: { $case: 'vote', vote: voteTx } }).finish()
          return await signTransaction.apply(this, [tx, message, wallet])
        }
      }

      return await signTransaction.apply(this, [tx, message, wallet])
    }
    const voteId = await client.submitVote(vote)
    client.voteService.signTransaction = signTransaction

    return voteId
  }
}

const getHex = (): string => {
  return toKeccak256('0x' + Buffer.from(vocdoniCryptoHelper.getBytes(32)).toString('hex'))
}
