import { CryptoError } from './errors'
import { VocdoniCryptoHelper } from './types'

const buildVocdoniCryptoHelper = (): VocdoniCryptoHelper => {
  const _helper: VocdoniCryptoHelper = {
    createAccount: account => {
      if (_helper.AccountClass == null) {
        throw new CryptoError()
      }
      return new _helper.AccountClass(account)
    },

    createSDK: options => {
      if (_helper.SDKClass == null) {
        throw new CryptoError()
      }

      return new _helper.SDKClass(options)
    },

    createCspCensus: (publicKey, cspUrl) => {
      if (_helper.CspCensusClass == null) {
        throw new CryptoError()
      }

      return new _helper.CspCensusClass(publicKey, cspUrl)
    },

    strip0x: value => {
      if (_helper.strip0xFunc == null) {
        throw new CryptoError()
      }

      return _helper.strip0xFunc(value)
    },

    createElection: params => {
      if (_helper.createElectionFunc == null) {
        throw new CryptoError()
      }

      return _helper.createElectionFunc(params)
    },

    createPublishedCensus: (censusId, censusURI, type, size, weight) => {
      if (_helper.PublishedCensusClass == null) {
        throw new CryptoError()
      }

      return new _helper.PublishedCensusClass(censusId, censusURI, type, size, weight)
    },

    createVote: votes => {
      if (_helper.VoteClass == null) {
        throw new CryptoError()
      }

      return new _helper.VoteClass(votes)
    },

    voteInfo: (url, voteId) => {
      if (_helper.voteInfoFunc == null) {
        throw new CryptoError()
      }

      return _helper.voteInfoFunc(url, voteId)
    },

    getBytes: count => {
      if (_helper.getBytesFunc == null) {
        throw new CryptoError()
      }

      return _helper.getBytesFunc(count)
    }
  }

  return _helper
}

export const vocdoniCryptoHelper = buildVocdoniCryptoHelper()
