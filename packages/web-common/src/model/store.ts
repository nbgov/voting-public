import type { CommonContext } from '../context/types'
import type { StoreHelper } from './types'

export const buildStoreHelper = (_ctx: CommonContext): StoreHelper => {
  const _helper: StoreHelper = {
    has: async key => {
      return localStorage.getItem(key) ? true : false
    },

    get: async <T>(key: string) => {
      const value = localStorage.getItem(key)

      if (value == null) {
        return value as T
      }

      return JSON.parse(value) as T
    },

    save: async (key, value) => {
      localStorage.setItem(key, JSON.stringify(value))

      return true
    },

    storeVote: async (poll, voteId, votes) => {
      const result = await _helper.save('vote:' + poll._id, voteId)
      if (votes != null) {
        await _helper.save('vote-info:' + voteId, votes)
      }
      return result
    },

    loadVote: async poll => _helper.get('vote:' + poll._id),

    loadVotes: async voteId => _helper.get('vote-info:' + voteId)
  }

  return _helper
}
