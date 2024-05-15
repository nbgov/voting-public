import { toKeccak256, CensusSyntaxError, parseElectionResults, PollReadyError, type PollResult, PollStatus, updateVocdoniPoll, VoteEmptyError, VoteError, type VotingServiceStrategy, VOCDONI_SUPPORTED_CENSUSES, VOCDONI_CENSUS_CSP_NBNS, VOCDONI_CENSUS_OFFCHAIN, VOCDONI_CSP_CENSUSES, VOCDONI_CENSUS_CSP_BLINDNS, AccountBalanceError, prepareQuestions } from '@smartapps-poll/common'
import type { PollInfo } from '@smartapps-poll/common'
import { type Census, type CensusType, type EnvOptions, type VocdoniSDKClient } from '@vocdoni/sdk'
import { type CommonContext } from '../../context'
import { type WebWallet } from '../../service/vocdoni/types'
import { type WebStrategy } from '../types'
import { VOCDONI_STARTEGY } from './consts'
import { VocdoniImplError } from './errors'
import { cspService } from './csp'
import type { Wallet } from '@ethersproject/wallet'
import { vocdoniCryptoHelper } from '../../service'

export const createVocdoniServiceStrategy = (): VotingServiceStrategy<CommonContext> => {
  const _: {
    strategy?: WebStrategy
    service?: VocdoniSDKClient
  } = {}

  const _get = async (): Promise<VocdoniSDKClient> => {
    if (_.service == null) {
      const config = _.strategy?.ctx().getApiConfiguration()
      const env = config?.vocdoni?.env ?? 'dev' as EnvOptions
      _.service = vocdoniCryptoHelper.createSDK({
        env,
        wallet: _.strategy?.wallet().get<WebWallet>() as any,
        tx_wait: {
          attempts: 30,
          retry_time: 1500
        }
      })
    } else {
      _.service.wallet = _.strategy?.wallet().get<WebWallet>() as any
    }

    return _.service
  }

  const _createElection = async (poll: PollInfo) => {
    if (poll.census == null) {
      throw new CensusSyntaxError(VOCDONI_STARTEGY, 'no')
    }

    const apiConfig = _.strategy?.ctx().getApiConfiguration()

    let census: Census

    let censusUrl: string = `${apiConfig?.url}${_.strategy?.ctx().endpoints.verification.vocdoni}`

    const additionalFields: { maxCensusSize?: number } = {}

    switch (poll.census.type) {
      case VOCDONI_CENSUS_CSP_BLINDNS:
        censusUrl = `${apiConfig?.url}${_.strategy?.ctx().endpoints.verification.vocdoniBlind}`
      case VOCDONI_CENSUS_CSP_NBNS:
        census = vocdoniCryptoHelper.createCspCensus(vocdoniCryptoHelper.strip0x(poll.census.externalId), censusUrl)
        additionalFields.maxCensusSize = poll.census.size
        break
      case VOCDONI_CENSUS_OFFCHAIN:
      default:
        additionalFields.maxCensusSize = vocdoniCryptoHelper.getCensusSize != null
          ? (await vocdoniCryptoHelper.getCensusSize(_.service?.url ?? '', poll.census.externalId)).size
          : 0
        census = vocdoniCryptoHelper.createPublishedCensus(poll.census.externalId, poll.census.url ?? _.service?.url as string, "weighted" as CensusType)
        break
    }

    const election = vocdoniCryptoHelper.createElection({
      title: { default: poll.title },
      description: { default: poll.description ?? '' },
      // startDate: new Date(), // @TODO replace with real start date
      endDate: new Date(poll.endDate),
      electionType: {
        autoStart: true,
        interruptible: true,
        dynamicCensus: false,
        secretUntilTheEnd: [VOCDONI_CENSUS_CSP_NBNS, VOCDONI_CENSUS_CSP_BLINDNS].includes(poll.census.type ?? ''),
        anonymous: false
      },
      voteType: {
        uniqueChoices: true,
        maxVoteOverwrites: 0,
        costFromWeight: false
      },
      questions: prepareQuestions(poll),
      ...additionalFields,
      census
    })

    return election
  }


  const _strategy: VotingServiceStrategy<CommonContext> = {
    isAuthenticated: () => _.strategy?.ctx().vocdoni.account.entity != null,
    setStrategyContext: strategy => { _.strategy = strategy },

    account: {
      entity: <E>() => _.strategy?.ctx().vocdoni.account.entity as E,

      create: async <T>(name: string) =>
        await (_.strategy?.ctx().vocdoni.account.create({ name }, _.strategy.wallet().get()) as Promise<T>),

      fetchEntity: async <E>() =>
        await (_.strategy?.ctx().vocdoni.account.fetchEntity() as Promise<E>),

      fetch: async <E>() =>
        await (_.strategy?.ctx().vocdoni.account.fetch() as Promise<E>),

      getTokensCount: async () => {
        const info = await _.strategy?.ctx().vocdoni.client.fetchAccount()

        return info?.balance ?? 0
      },

      collectFaucetTokens: async token => {
        const client = await _get()

        const info = await client.collectFaucetTokens(token)

        return info.balance
      }
    },

    census: {
      create: async () => {
        throw new VocdoniImplError('census.create')
      },

      register: async () => {
        throw new VocdoniImplError('census.register')
      },

      check: async () => {
        throw new VocdoniImplError('census.check')
      },

      publish: async () => {
        throw new VocdoniImplError('census.publish')
      },

      getSupportedTypes: async () => VOCDONI_SUPPORTED_CENSUSES,

      getCSPTypes: () => VOCDONI_CSP_CENSUSES,

      isCSPType: type => VOCDONI_CSP_CENSUSES.includes(type)
    },

    poll: {
      estimate: async poll => {
        const client = await _get()
        const election = await _createElection(poll)

        return client.estimateElectionCost(election)
      },

      publish: async (poll) => {
        if (poll.census == null) {
          throw new CensusSyntaxError(VOCDONI_STARTEGY, 'no')
        }
        if (poll.census.url == null && [VOCDONI_CENSUS_OFFCHAIN].includes(poll.census.type as string)) {
          throw new CensusSyntaxError(VOCDONI_STARTEGY, 'notpublished')
        }
        const client = await _get()

        const election = await _createElection(poll)

        let info = await client.fetchAccount()
        const price = await client.calculateElectionCost(election)
        console.info('info before tapping', info)
        console.info('price', price)

        if (info.balance < price) {
          throw new AccountBalanceError()
        }

        return await client.createElection(election)
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

      authorizeVote: async (poll) => {
        if (poll.status !== PollStatus.STARTED) {
          throw new PollReadyError('poll.not.started')
        }
        if (poll.externalId == null) {
          throw new PollReadyError('poll.not.defined')
        }
        if (!_.strategy?.isAuthenticated()) {
          const wallet = await _.strategy?.wallet().createWallet()
          _.strategy?.wallet().setWallet(wallet)
        }
        // console.log('token', _.strategy?.ctx().web.authToken)
        const client = await _get()
        client.setElectionId(poll.externalId)

        switch (poll.census?.type) {
          case VOCDONI_CENSUS_CSP_NBNS: {
            const caBundle = cspService.createCABundle(poll.externalId ?? '', await _.strategy?.getAddress() ?? '')
            const hexBundle = cspService.packCABundle(caBundle)

            const { signature } = await client.cspStep(
              0, [{ payload: vocdoniCryptoHelper.strip0x(hexBundle) }], _.strategy?.ctx().web.authToken
            ) as unknown as { signature: string }

            return signature
          }
          default:
          case VOCDONI_CENSUS_CSP_BLINDNS: {
            const { token } = await client.cspStep(
              0, [], _.strategy?.ctx().web.authToken
            ) as unknown as { token: string }

            const signature = await client.cspSign(
              await _.strategy?.getAddress() ?? '', token
            )

            return signature
          }
        }
      },

      vote: async (poll, vote, signature) => {
        if (poll.status !== PollStatus.STARTED) {
          throw new PollReadyError('poll.not.started')
        }
        if (poll.externalId == null) {
          throw new PollReadyError('poll.not.defined')
        }
        if (vote.length === 0) {
          throw new VoteEmptyError()
        }
        if (vote.some(question => question.choices.length !== 1)) {
          throw new VoteEmptyError('answers.malformed')
        }
        const client = await _get()
        client.setElectionId(poll.externalId)

        const answers = vote.map(question => question.choices[0].value)

        let voteId: string = ''

        let i: number = 0
        do {
          console.info('Try to submit vote')
          try {
            switch (poll.census.type) {
              case VOCDONI_CENSUS_CSP_BLINDNS:
              case VOCDONI_CENSUS_CSP_NBNS:
                if (typeof signature !== 'string') {
                  throw new VoteEmptyError('csp_nbsp.unsigned')
                }
                voteId = await cspService.submitVote(
                  client, poll,
                  {
                    answers, signature: vocdoniCryptoHelper.strip0x(signature), address: await _.strategy?.getAddress() ?? ''
                  }
                )

                _.strategy?.ctx().web.unauthenticate()
                break
              case VOCDONI_CENSUS_OFFCHAIN:
              default:
                voteId = await client.submitVote(vocdoniCryptoHelper.createVote(answers))
                break
            }
          } catch (e) {
            console.error(e)
            if (i === 3) {
              throw e
            }
          }
          if (voteId != '') {
            break
          }
        } while (i++ < 3)

        if (voteId == '') {
          return [false, voteId]
        }

        return [true, voteId]
      },

      info: async poll => {
        const res: PollResult = {} as unknown as PollResult
        // if ([VOCDONI_CENSUS_CSP_NBNS].includes(poll.census.type ?? '')) {
        //   return res
        // }
        if (![PollStatus.PUBLISHED, PollStatus.UNPUBLISHED].includes(poll.status) && poll.externalId != null) {
          const client = await _get()
          const election = await client.fetchElection(poll.externalId)

          return parseElectionResults(election)
        }
        return res
      },

      check: async poll => {
        try {
          if (poll.externalId != null) {
            const client = await _get()

            return {
              valid: true,
              exists: await client.isInCensus({ wallet: client.wallet as unknown as Wallet, electionId: poll.externalId }),
              voted: await client.hasAlreadyVoted({ wallet: client.wallet as unknown as Wallet, electionId: poll.externalId }) !== '',
              allowed: await client.isAbleToVote({ wallet: client.wallet as unknown as Wallet, electionId: poll.externalId })
            }
          }
        } catch (e) {
          console.error(e)
        }
        return { valid: false, exists: false, voted: false, allowed: false }
      },

      finish: async poll => {
        try {
          if (poll.externalId != null) {
            const client = await _get()

            await client.endElection(poll.externalId)
            const election = await client.fetchElection(poll.externalId)

            return election.status === "ENDED"
          }
        } catch (e) {
          console.error(e)
        }
        return false
      },

      read: async (poll, voteId) => {
        if (poll.externalId == null) {
          throw new VoteError('poll.no')
        }
        const client = await _get()

        const result = await vocdoniCryptoHelper.voteInfo(
          client.url,
          voteId ?? toKeccak256(
            (await client.wallet?.getAddress() ?? '0x').toLowerCase() + (poll.externalId ?? '')
          )
        )

        let votes: number[] = []
        if (typeof result.package === 'string') {
          const _package = JSON.parse(result.package)
          votes = _package.votes
        } else if (result.package != null) {
          votes = (result.package as unknown as { votes: number[] }).votes
        }

        return {
          tx: result.txHash,
          externalId: result.voteID,
          result: votes,
          externalPollID: result.electionID,
          overwriteCount: result.overwriteCount,
          date: new Date(result.date)
        }
      }
    },

    getType: () => VOCDONI_STARTEGY
  }

  return _strategy
}
