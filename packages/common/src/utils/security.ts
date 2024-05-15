import type { BytesLike, Wallet } from 'ethers'
import type { argon2id } from '@noble/hashes/argon2'
// import * as ethers from 'ethers'

// let _ethers: any
// export const hydrateEthers = (eth: any) => {
//   _ethers = eth
// }
let ethers: any
export const hydrateEthers = (eth: any): void => {
  ethers = eth
}

let argon2: typeof argon2id
export const hydarteArgon = (argon: typeof argon2id): void => {
  argon2 = argon
}

export const hash = (salt: string, value: string): string =>
  hexToBase58(ethers.sha512(ethers.toUtf8Bytes(`${salt}${value}`)))

export const advancedHash = async (salt: string, value: string): Promise<string> =>
  ethers.encodeBase64(await argon2(value, salt, { t: 1, m: 65536, p: 1 }))

export const randomToken = (): string => ethers.encodeBase58(ethers.randomBytes(32))

export const getWalletUtils = (): typeof Wallet => ethers.Wallet

export const toBase64 = (value: string): string => ethers.encodeBase64(ethers.toUtf8Bytes(value))

export const hexToBase58 = (hex: string): string => ethers.encodeBase58(ethers.getBytes(hex))

export const fromBase64 = (value: string): string => ethers.toUtf8String(ethers.decodeBase64(value))

export const toKeccak256 = (value: string): string => ethers.keccak256(ethers.getBytes(value))

export const hexlify = (value: BytesLike | number | bigint): string => ethers.hexlify(value)
