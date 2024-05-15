import type { Account, AccountData, IAccount, VocdoniSDKClient, ClientOptions } from '@vocdoni/sdk'
import type { CensusAPI, CspCensus, strip0x, Election, UnpublishedElection, IElectionParameters } from '@vocdoni/sdk'
import type { PublishedCensus, CensusType, Vote, IVoteInfoResponse, getBytes } from '@vocdoni/sdk'
import type { HDNodeWallet } from 'ethers'

export interface VocdoniService {
  client: VocdoniSDKClient

  setWallet: (wallet: WebWallet) => void

  wallet: () => WebWallet

  encrypt: (secret?: string) => Promise<string>

  setSecret: (secret: string) => void

  account: {
    entity?: Account

    create: (account: IAccount, wallet?: WebWallet) => Promise<AccountData>

    fetchEntity: (wallet?: WebWallet) => Promise<Account>

    fetch: (wallet?: WebWallet) => Promise<AccountData>
  }
}

export type WebWallet = HDNodeWallet

export interface VocdoniCryptoHelper {
  AccountClass?: { new(account: IAccount): Account }

  SDKClass?: { new(options: ClientOptions): VocdoniSDKClient }

  CspCensusClass?: { new(publicKey: string, cspUrl: string): CspCensus }

  PublishedCensusClass?: { new(censusId: string, censusURI: string, type: CensusType, size?: number, weight?: bigint): PublishedCensus }

  VoteClass?: { new(votes: Array<number | bigint>): Vote }

  voteInfoFunc?: (url: string, voteId: string) => Promise<IVoteInfoResponse>

  getBytesFunc?: typeof getBytes

  createElectionFunc?: typeof Election.from

  getCensusSize?: typeof CensusAPI.size

  strip0xFunc?: typeof strip0x

  createAccount: (account: IAccount) => Account

  createSDK: (options: ClientOptions) => VocdoniSDKClient

  createCspCensus: (publicKey: string, cspUrl: string) => CspCensus

  strip0x: typeof strip0x

  createElection: (params: IElectionParameters) => UnpublishedElection

  createPublishedCensus: (censusId: string, censusURI: string, type: CensusType, size?: number, weight?: bigint) => PublishedCensus

  createVote: (votes: Array<number | bigint>) => Vote

  voteInfo: (url: string, voteId: string) => Promise<IVoteInfoResponse>

  getBytes: typeof getBytes
}
