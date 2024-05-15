import { DEFNAV, type ViewState } from '@smartapps-poll/web-common'

export const POLL_VIEW_REGISTRATION = 'poll-registeration'

export const POLL_VIEW_VOTE = 'poll-vote'

export const POLL_VIEW_INFO = 'poll-info'

export const POLL_RESULTS_INFO = 'poll-results'

export const pollViewRegister = (): ViewState => ({ screen: POLL_VIEW_REGISTRATION })

export const pollViewVote = (): ViewState => ({ screen: POLL_VIEW_VOTE })

export const pollInfoVote = (): ViewState => ({ screen: POLL_VIEW_INFO })

export const pollResultsVote = (voteId?: string): ViewState<{ voteId?: string }> => (
  { screen: POLL_RESULTS_INFO, params: { voteId } }
)

export const emptyScreen = (): ViewState => ({ screen: DEFNAV })

export enum Registration {
  UNKNOWN = 1,
  NOTREGISTERD = 2,
  REGISTERED = 3,
}

export const AXIOS_ERROR_CODE_ONDUPLICATION = 401
