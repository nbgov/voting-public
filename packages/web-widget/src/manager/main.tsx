// import { MemberRole } from "@smartapps-poll/common"
import { useNavigation, Navigator, Screen } from '@smartapps-poll/web-common'
import { useState, type FunctionComponent, useEffect } from 'react'
import { PollCreation } from './components/poll/creation'
import { PollEdit } from './components/poll/edit'
import { screenPollEdit, SCREEN_POLL_CREATION, SCREEN_POLL_EDIT, SCREEN_POLL_LIST, screePollList, screenPollManage, SCREEN_POLL_MANAGE } from './consts'
import { PollListScreen } from './screens/poll/list'
import { PollManage } from './components/poll/manage'
import { PollStatus } from '@smartapps-poll/common'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { useCtx } from '../shared/context'
import { ClaimFaucets } from './components/vocdoni/claim-faucet'

export const Main: FunctionComponent = () => {
  const nav = useNavigation({ defaultState: screePollList() })
  const ctx = useCtx()

  const [address, setAddress] = useState<string>('')
  const [tokens, setTokens] = useState<number>(0)
  useEffect(() => {
    void (async () => {
      setAddress(await ctx.strategy.getAddress() ?? '')
      setTokens(await ctx.strategy.service().account.getTokensCount())
    })()
  }, [])

  return <Navigator navigation={nav}>
    <Screen screen={SCREEN_POLL_LIST}>
      <Grid container direction="row" justifyContent="space-between" alignItems="stretch" mt={1}>
        <Grid container item xs={6}>
          <ClaimFaucets setTokens={setTokens} />
        </Grid>
        <Grid item xs={6} alignItems="flex-end" textAlign="end">
          <Typography variant="overline">{address}: {tokens}</Typography>
        </Grid>
      </Grid>
      <PollListScreen onEdit={async id => { nav.add(screenPollEdit(id)) }}
        onManage={async id => { nav.add(screenPollManage(id)) }} />
    </Screen>
    <Screen screen={SCREEN_POLL_CREATION}>
      <PollCreation onCancel={async () => { nav.back() }}
        onSuccess={async id => { nav.go(screenPollEdit(id)) }} />
    </Screen>
    <Screen screen={SCREEN_POLL_EDIT} render={view =>
      <PollEdit id={view.params.id}
        onCancel={async () => { nav.back() }}
        onSuccess={async status => {
          switch (status) {
            case PollStatus.STARTED:
              nav.go(screenPollManage(view.params.id))
          }
        }} />
    } />
    <Screen screen={SCREEN_POLL_MANAGE} render={view =>
      <PollManage id={view.params.id}
        onCancel={async () => { nav.back() }}
        onSuccess={async () => { nav.go(screePollList()) }} />
    } />
  </Navigator>
}
