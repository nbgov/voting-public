import type { Wallet } from '@ethersproject/wallet'
import { CensusStatus, CensusSyntaxError, getWalletUtils, parseElectionResults, type PollInfo, type PollResult, PollStatus, updateVocdoniPoll, type User, type VotingServiceStrategy, VOCDONI_SUPPORTED_CENSUSES, VOCDONI_CENSUS_OFFCHAIN, VOCDONI_CENSUS_CSP_NBNS, VOCDONI_CSP_CENSUSES, VOCDONI_CENSUS_CSP_BLINDNS } from '@smartapps-poll/common'
import { CensusAPI, CensusType, EnvOptions, VocdoniSDKClient, WalletAPI, strip0x } from '@vocdoni/sdk'
import { type Context } from '../../types'
import { type ServerStrategy } from '../types'
import { VOCDONI_STARTEGY } from './consts'
import { VocdoniImplError } from './errors'
import { buildDbSecurityHelper } from '../../db/security'

export const createVocdoniServiceStrategy = (): VotingServiceStrategy<Context> => {
  const _: {
    strategy?: ServerStrategy
    service?: VocdoniSDKClient
    wallet?: Wallet
  } = {}

  const _get = async (): Promise<VocdoniSDKClient> => {
    if (_.service == null) {
      _.wallet = _.strategy?.wallet().get<Wallet>() ?? await _.strategy?.wallet().createWallet<Wallet>()
      _.service = new VocdoniSDKClient({
        env: _.strategy?.ctx().config.vocdoni.env ?? EnvOptions.DEV,
        wallet: _.wallet
      })
    }

    return _.service
  }

  const _strategy: VotingServiceStrategy<Context> = {
    isAuthenticated: () => {
      throw new VocdoniImplError('isAuthenticated')
    },
    setStrategyContext: strategy => { _.strategy = strategy },

    account: {
      entity: () => {
        throw new VocdoniImplError('account.entity')
      },

      create: async () => {
        throw new VocdoniImplError('account.create')
      },

      fetchEntity: async () => {
        throw new VocdoniImplError('account.fetchEntity')
      },

      fetch: async () => {
        throw new VocdoniImplError('account.fetch')
      },

      getTokensCount: async () => {
        throw new VocdoniImplError('account.getTokensCount')
      },

      collectFaucetTokens: async () => {
        throw new VocdoniImplError('account.collectFaucetTokens')
      }
    },

    census: {
      create: async poll => {
        const vocdoni = await _get()
        const wallet = getWalletUtils().createRandom()
        const walletInfo = await WalletAPI.add(vocdoni.url, wallet.privateKey)

        switch (poll.census?.type) {
          case VOCDONI_CENSUS_CSP_BLINDNS:
          case VOCDONI_CENSUS_CSP_NBNS: {
            let encryptedWallet = await wallet.encrypt(_.strategy?.ctx().config.salt ?? '')
            if (_.strategy != null) {
              const skHelper = buildDbSecurityHelper(_.strategy?.ctx())
              encryptedWallet = await skHelper.encryptSecretKey(Buffer.from(encryptedWallet, 'utf8'))
            }
            return {
              token: encryptedWallet,
              externalId: wallet.publicKey,
              status: CensusStatus.UNPUBLISHED,
              type: poll.census.type,
              size: parseInt(poll.census.size as unknown as string)
            }
          }
          case VOCDONI_CENSUS_OFFCHAIN:
          default: {
            // @TODO try to use anonymized census instead
            const census = await CensusAPI.create(vocdoni.url, walletInfo.token, CensusType.WEIGHTED)

            let token = walletInfo.token
            if (_.strategy != null) {
              const skHelper = buildDbSecurityHelper(_.strategy?.ctx())
              token = await skHelper.encryptSecretKey(Buffer.from(token, 'utf8'))
            }

            return {
              token,
              externalId: census.censusID,
              status: CensusStatus.UNPUBLISHED,
              type: poll.census?.type ?? VOCDONI_CENSUS_OFFCHAIN
            }
          }
        }
      },

      register: async <E>(poll: PollInfo, user: User) => {
        const vocdoni = await _get()
        if (poll.census == null) {
          throw new CensusSyntaxError(VOCDONI_STARTEGY, 'poll doesn\'t contain one')
        }
        if (poll.census.token == null) {
          throw new CensusSyntaxError(VOCDONI_STARTEGY, 'no token')
        }
        if (user == null || user.votingAddress == null) {
          throw new CensusSyntaxError(VOCDONI_STARTEGY, 'no user address')
        }
        let token = poll.census.token
        if (_.strategy != null) {
          const skHelper = buildDbSecurityHelper(_.strategy?.ctx())
          token = (await skHelper.decryptSecretKey(token)).toString('utf8')
        }
        await CensusAPI.add(
          vocdoni.url, token, poll.census.externalId, [{ key: strip0x(user.votingAddress) }]
        )

        const result = await CensusAPI.proof(vocdoni.url, poll.census.externalId, user.votingAddress)

        return result as E
      },

      check: async <E>(poll: PollInfo, address: string) => {
        const vocdoni = await _get()
        if (poll.census == null) {
          throw new CensusSyntaxError(VOCDONI_STARTEGY, 'poll doesn\'t contain one')
        }
        if (poll.census.token == null) {
          throw new CensusSyntaxError(VOCDONI_STARTEGY, 'no token')
        }
        if (address == null) {
          throw new CensusSyntaxError(VOCDONI_STARTEGY, 'no user address')
        }
        const result = await CensusAPI.proof(vocdoni.url, poll.census.externalId, address)

        return result as E
      },

      publish: async poll => {
        const vocdoni = await _get()
        if (poll.census == null) {
          throw new CensusSyntaxError(VOCDONI_STARTEGY, 'poll doesn\'t contain one')
        }
        if (poll.census.token == null) {
          throw new CensusSyntaxError(VOCDONI_STARTEGY, 'no token')
        }

        switch (poll.census?.type) {
          case VOCDONI_CENSUS_CSP_BLINDNS:
          case VOCDONI_CENSUS_CSP_NBNS:
            return { ...poll.census, status: CensusStatus.PUBLISHED }
          case VOCDONI_CENSUS_OFFCHAIN:
          default: {
            let token = poll.census.token
            if (_.strategy != null) {
              const skHelper = buildDbSecurityHelper(_.strategy?.ctx())
              token = (await skHelper.decryptSecretKey(token)).toString('utf8')
            }
            const result = await CensusAPI.publish(vocdoni.url, token, poll.census.externalId)
            return { ...poll.census, externalId: result.censusID, url: result.uri, status: CensusStatus.PUBLISHED }
          }
        }
      },

      getSupportedTypes: async () => VOCDONI_SUPPORTED_CENSUSES,

      getCSPTypes: () => VOCDONI_CSP_CENSUSES,

      isCSPType: type => VOCDONI_CSP_CENSUSES.includes(type)
    },

    poll: {
      publish: async () => {
        throw new VocdoniImplError('poll.publish')
      },

      estimate: async () => {
        throw new VocdoniImplError('poll.estimate')
      },

      update: async poll => {
        if (![PollStatus.PUBLISHED, PollStatus.UNPUBLISHED].includes(poll.status) &&
          poll.externalId != null) {
          const client = await _get()
          const election = await client.fetchElection(poll.externalId)
          return updateVocdoniPoll(poll, election)
        }
        return poll
      },

      authorizeVote: async () => {
        throw new VocdoniImplError('poll.authorizeVote')
      },

      vote: async () => {
        throw new VocdoniImplError('poll.vote')
      },

      info: async poll => {
        if (![PollStatus.PUBLISHED, PollStatus.UNPUBLISHED].includes(poll.status) &&
          poll.externalId != null) {
          const client = await _get()
          const election = await client.fetchElection(poll.externalId)

          return parseElectionResults(election)
        }
        return {} as unknown as PollResult
      },

      check: async () => {
        throw new VocdoniImplError('poll.check')
      },

      finish: async () => {
        throw new VocdoniImplError('poll.finish')
      },

      read: async () => {
        throw new VocdoniImplError('poll.info')
      }
    },

    getType: () => VOCDONI_STARTEGY
  }

  return _strategy
}
