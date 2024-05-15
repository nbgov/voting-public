import { type Census, type NewPoll, type Poll, type PollInfo, type PollRegistrationInfo, type PollResult, type Question, type RequiredProof, type VoteInfo } from '../poll'
import { type User } from '../user/types'

export interface BaseVotingStrategy<C> {
  ctx: () => C
  wallet: () => VotingWalletStrategy<C>
  service: () => VotingServiceStrategy<C>
  creds: () => CredentialsWalletStrategy<C>
}

export interface VotingStrategyBuilder<C> {
  voting: {
    wallet: (wallet: VotingWalletStrategy<C>) => VotingStrategyBuilder<C>
    service: (service: VotingServiceStrategy<C>) => VotingStrategyBuilder<C>
  }
  credentials: {
    wallet: (wallet: CredentialsWalletStrategy<C>) => VotingStrategyBuilder<C>
  }
  build: () => VotingStrategy<C>
}

export interface VotingStrategy<C> extends BaseVotingStrategy<C>, WithAuthentication {
  getAddress: () => Promise<string | undefined>
}

export interface CredentialsWalletStrategy<C> extends VotingStrategyPiece<C>, WithAuthentication {
  getRequiredProofList: (kind: string) => Promise<RequiredProofAction[]>
  castProofInfo: (proof: RequiredProof | RequiredProof[]) => RequiredProofAction
  challenge: (poll: Poll | PollInfo) => Promise<boolean>
}

export interface VotingWalletStrategy<C> extends VotingStrategyPiece<C>, WithAuthentication {
  getAddress: () => Promise<string | undefined>
  get: <W>() => W
  setWallet: <W>(wallet: W) => void
  createWallet: <W>() => Promise<W>
  export: (password: string) => Promise<string>
  import: <W>(password: string, store: string) => Promise<W>
}

export interface VotingServiceStrategy<C> extends VotingStrategyPiece<C>, WithAuthentication {
  account: {
    entity: <E>() => E | undefined
    create: <T>(name: string) => Promise<T>
    fetchEntity: <E>() => Promise<E>
    fetch: <E>() => Promise<E>
    getTokensCount: () => Promise<number>
    collectFaucetTokens: (token?: string) => Promise<number>
  }
  census: {
    create: (poll: NewPoll) => Promise<Census>
    register: <E>(poll: PollInfo, user: User) => Promise<E | undefined>
    check: <E>(poll: PollInfo, address: string) => Promise<E | undefined>
    publish: (poll: PollInfo) => Promise<Census>
    getSupportedTypes: () => Promise<string[]>
    getCSPTypes: () => string[]
    isCSPType: (type: string) => boolean
  }
  poll: {
    estimate: (poll: PollInfo) => Promise<number>
    publish: (poll: PollInfo) => Promise<string>
    update: (poll: PollInfo) => Promise<PollInfo>
    authorizeVote: (poll: PollInfo) => Promise<string>
    vote: (poll: Poll, votes: Question[], signature?: string) => Promise<[boolean, string]>
    info: (poll: Poll) => Promise<PollResult>
    check: (poll: Poll) => Promise<PollRegistrationInfo>
    finish: (poll: Poll) => Promise<boolean>
    read: (poll: Poll, voteId?: string) => Promise<VoteInfo>
  }
}

export interface VotingStrategyPiece<C> {
  setStrategyContext: (strategy: VotingStrategy<C>) => void
  getType: () => string
}

interface WithAuthentication {
  isAuthenticated: () => boolean
}

export interface RequiredProofAction extends Record<string, unknown> {
  type: string
  title?: string
  refId?: string
  guideUrl?: string
}
