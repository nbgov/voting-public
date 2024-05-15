import type { ViewState, ViewStateParams } from '@smartapps-poll/web-common'

export const SCREEN_POLL_LIST = 'poll-list'

export const screePollList = (): ViewState => ({ screen: SCREEN_POLL_LIST })

export const SCREEN_POLL_CREATION = 'poll-creation'

export const screenPollCreation = (): ViewState => ({ screen: SCREEN_POLL_CREATION })

export const SCREEN_POLL_EDIT = 'poll-edit'

export const screenPollEdit = (id: string): PollEditView => ({
  screen: SCREEN_POLL_EDIT, params: { id }
})

export const SCREEN_POLL_MANAGE = 'poll-manage'

export const screenPollManage = (id: string): PollEditView => ({
  screen: SCREEN_POLL_MANAGE, params: { id }
})

export interface PollEditView extends ViewState<PollEditViewParams> {
  params: PollEditViewParams
}

export interface PollEditViewParams extends ViewStateParams {
  id: string
}
