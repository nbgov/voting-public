import { beforeAll, describe, expect, it } from '@jest/globals'
import {
  BBSPlusCredential, BBSPlusCredentialBuilder, BBSPlusKeypairG2, BBSPlusPublicKeyG2,
  BBSPlusSecretKey,
  BBSPlusSignatureParamsG1, BBS_PLUS_SIGNATURE_PARAMS_LABEL, BBS_PLUS_SIGNATURE_PARAMS_LABEL_BYTES,
  CredentialSchema, PresentationBuilder, initializeWasm
} from '@docknetwork/crypto-wasm-ts'
import { randomToken } from '@smartapps-poll/common'
import * as ethers from 'ethers'
import { hydrateEthers } from '@smartapps-poll/common'
import { getBytes } from '@vocdoni/sdk'
import { buildDbSecurityHelper } from '../../src/db/security'
import { context } from '../../src/context'

describe('Docknetwork VC cryptography', () => {
  beforeAll(async () => {
    await initializeWasm()
    hydrateEthers(ethers)
  })

  it('creates and verifies a credential', async () => {
    const credSchema = CredentialSchema.essential()
    /**
     * !!! We store ownership information for holder and issuer
     * right inside VC
     */
    credSchema.definitions = {
      ...credSchema.definitions,
      didId: { type: 'string', format: 'uri-reference' },
      didMethod: {
        type: 'object',
        properties: {
          id: { $ref: '#/definitions/didId' },
          type: { type: 'string' },
          controller: { $ref: "#/definitions/didId" },
          publicKeyMultibase: { type: 'string' }
        }
      },
      didObject: {
        type: 'object',
        properties: {
          id: { $ref: '#/definitions/didId' },
          verificationMethod: { $ref: '#/definitions/didMethod' }
        }
      }
    }
    credSchema.properties['holder'] = { $ref: '#/definitions/didObject' }
    credSchema.properties['issuer'] = { $ref: '#/definitions/didObject' }
    credSchema.properties['id'] = { $ref: '#/definitions/didId' }

    // console.log(credSchema.properties.credentialSubject)

    // const subjectSchemas = credSchema.properties.credentialSubject
    // const subjectSchema = Array.isArray(subjectSchemas) ? subjectSchemas[0] : subjectSchemas
    // subjectSchema.properties = {
    //         ...subjectSchema.properties,
    //         personalId: { type: 'string' }
    // }

    const params = BBSPlusSignatureParamsG1.generate(
      100, BBS_PLUS_SIGNATURE_PARAMS_LABEL_BYTES
    )
    const keypair = BBSPlusKeypairG2.generate(params)

    const schema = new CredentialSchema(credSchema)

    const builder = new BBSPlusCredentialBuilder()
    builder.schema = schema

    const docId = randomToken()
    const holderId = randomToken()
    const issuerId = randomToken()

    const holderKeypair = BBSPlusKeypairG2.generate(params, getBytes(32))

    builder.setTopLevelField('id', docId)
    // We make a pseudo anonymized holder for the document to decouple from a 
    // real holder.
    // Then we form holder did document with holder's public key
    // !!! The following example is formed a bit wrongly:
    builder.setTopLevelField('holder', {
      id: docId,
      verificationMethod: {
        id: docId + '#verificatioMethod1',
        type: BBS_PLUS_SIGNATURE_PARAMS_LABEL,
        controller: holderId,
        publicKeyMultibase: holderKeypair.pk.hex
      }
    })
    // We add the issuer to the document, to make sure that the
    // issuers signature is verifiable
    builder.setTopLevelField('issuer', {
      id: issuerId,
      verificationMethod: {
        id: holderId + '#verificatioMethod1',
        type: BBS_PLUS_SIGNATURE_PARAMS_LABEL,
        controller: issuerId,
        publicKeyMultibase: keypair.pk.hex
      }
    })
    builder.subject = { id: '1234-1234-1234' }

    expect(keypair).not.toBeNull()

    // console.log(context.config)

    const helper = buildDbSecurityHelper(context)

    const wrappedKey = await helper.encryptSecretKey(Buffer.from(keypair.sk.bytes))
    console.log('Use wrapped key: ', wrappedKey)
    const skRaw = await helper.decryptSecretKey(wrappedKey)

    const sk = new BBSPlusSecretKey(skRaw)

    const cred = builder.sign(sk)

    const jsonCred = cred.toJSON()
    const restored = BBSPlusCredential.fromJSON(jsonCred)
    const issuer = restored.topLevelFields.get('issuer') as any
    console.log(issuer.verificationMethod.publicKeyMultibase)
    const restoredIssuerKey = new BBSPlusPublicKeyG2(
      BBSPlusPublicKeyG2.fromHex(issuer.verificationMethod.publicKeyMultibase).bytes
    )
    expect(restored.verify(restoredIssuerKey).verified).toBeTruthy()

    const presBuild = new PresentationBuilder()
    presBuild.addCredential(restored, keypair.pk)
    presBuild.markAttributesRevealed(0, new Set<string>(['credentialSubject.id', 'holder.id']))

    presBuild.nonce = getBytes(18)

    const pres = presBuild.finalize()

    const presRes = pres.verify([keypair.pk])
    expect(presRes.verified).toBeTruthy()
  })
})

