/**
 * Extracted from Vocdoni SDK
 */
import { Buffer } from 'buffer';
import nacl from 'tweetnacl';
import blake from 'blakejs';
import { VocdoniCryptoHelper } from '../../service/vocdoni/types';

export class Asymmetric {
  /**
   * Cannot be constructed.
   */
  private constructor() { }

  /**
   * Encrypts the given buffer with NaCl SealedBox using the given hex public key.
   * Returns a buffer with the encrypted payload.
   *
   * @param messageBytes - The payload to encrypt
   * @param hexPublicKey - 32 byte public key in hex format
   */
  static encryptRaw(messageBytes: Uint8Array, hexPublicKey: string, helper: VocdoniCryptoHelper): Buffer {
    const pubKeyBytes = Buffer.from(helper.strip0x(hexPublicKey), 'hex');

    const sealed = Asymmetric.seal(messageBytes, pubKeyBytes);
    return Buffer.from(sealed);
  }

  private static seal(m: Uint8Array, pk: Uint8Array): Uint8Array {
    const c = new Uint8Array(nacl.box.publicKeyLength + nacl.box.overheadLength + m.length);

    const ek = nacl.box.keyPair();
    c.set(ek.publicKey);

    const nonce = Asymmetric.nonceGenerator(ek.publicKey, pk);
    const boxed = nacl.box(m, nonce, pk, ek.secretKey);
    c.set(boxed, ek.publicKey.length);

    for (let i = 0; i < ek.secretKey.length; i++) {
      ek.secretKey[i] = 0;
    }

    return c;
  }

  private static nonceGenerator(pk1: Uint8Array, pk2: Uint8Array) {
    const state = blake.blake2bInit(nacl.box.nonceLength, undefined);
    blake.blake2bUpdate(state, pk1);
    blake.blake2bUpdate(state, pk2);
    return blake.blake2bFinal(state);
  }
}
