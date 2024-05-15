import { WalletStartegyImplError } from '@smartapps-poll/common'
import { ETHERS_STARTEGY } from './consts'

export class EthersWalletImplError extends WalletStartegyImplError {
  constructor (method: string) {
    super(ETHERS_STARTEGY, method)
  }
}
