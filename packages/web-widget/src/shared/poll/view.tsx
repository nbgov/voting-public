import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import { type Organization, type Poll, PollStatus } from '@smartapps-poll/common'
import { useNavigation, Navigator, Screen, WebContext, buildStoreHelper, setError } from '@smartapps-poll/web-common'
import { type FunctionComponent, useEffect, useState } from 'react'
import { useCtx } from '../context'
import { type Context } from '../types'
import { PollViewInfo } from './info'
import { PollViewRegistration } from './registration'
import { PollViewVote } from './vote'
import {
  emptyScreen, pollInfoVote, pollViewRegister, pollViewVote, POLL_VIEW_INFO, POLL_VIEW_REGISTRATION,
  POLL_VIEW_VOTE, Registration, pollResultsVote, POLL_RESULTS_INFO
} from './consts'
import { PollViewResults } from './results'
import Avatar from '@mui/material/Avatar'
import Grid from '@mui/material/Grid'
import useTheme from '@mui/material/styles/useTheme'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useSmallPaddings } from '../helpers'
import { useTranslation } from 'react-i18next'
import { useMemo } from 'react'
import { isViewWrapped } from './utils'

export const PollView: FunctionComponent<PollViewProps> = ({ context, id }) => {
  const { t } = useTranslation()
  const _context = useCtx()
  const theme = useTheme()
  const smallScreen = useMediaQuery(theme.breakpoints.down('md'))
  const paddingStyle = useSmallPaddings()
  context = context ?? _context

  const nav = useNavigation({ defaultState: emptyScreen() })
  const [status, setStatus] = useState<Registration>(Registration.UNKNOWN)
  const [poll, setPoll] = useState<Poll | undefined>(undefined)
  const [voteId, setVoteId] = useState<string | undefined>()
  const [org, setOrg] = useState<Organization | undefined>(undefined)

  useEffect(() => {
    void (async () => {
      if (poll?.serviceId == null || poll?.orgId == null) {
        return
      }
      const org = await context?.web.orgs.load(poll.serviceId, poll.orgId)
      setOrg(org)
    })()
  }, [poll?.serviceId, poll?.orgId])

  useEffect(() => {
    void (async () => {
      if (id != null) {
        const poll = await context?.web.polls.load(id)
        if (poll != null) {
          setVoteId(await buildStoreHelper(_context).loadVote(poll))
          setPoll(poll as Poll)
        } else {
          setError(t, 404, 'error.poll.no')
        }
      }
    })()
  }, [id])

  useEffect(() => {
    void (async () => {
      if (poll?.status != null && context != null &&
        ![PollStatus.UNPUBLISHED, PollStatus.PUBLISHED].includes(poll.status) &&
        poll.externalId != null) {
        try {
          setPoll(await context.strategy.service().poll.update(poll) as Poll)
        } catch (e) {
          console.error(e)
        }
      }
    })()
  }, [id, poll?.status])

  useEffect(() => {
    if (poll != null) {
      if (voteId != null && nav.current().screen !== POLL_RESULTS_INFO) {
        nav.go(pollResultsVote(voteId))
        return
      }
      switch (poll.status) {
        case PollStatus.PUBLISHED:
          nav.go(pollViewRegister())
          break
        case PollStatus.STARTED:
          nav.go(pollViewVote())
          break
        case PollStatus.FINISHED:
          nav.go(pollResultsVote())
          break
        default:
          nav.go(pollInfoVote())
          break
      }
    }
  }, [id, poll?.status])

  useEffect(() => {
    void (async () => {
      if (poll != null && (context as Context).isAuthenticated()) {
        const result = await context?.web.census.check(poll._id)
        setStatus(result != null ? Registration.REGISTERED : Registration.NOTREGISTERD)
      }
    })()
  }, [poll?._id, context.isAuthenticated()])

  const isWrapped = useMemo(() => context ? isViewWrapped(context) : false, [context])

  const onRegister = async (): Promise<void> => {
    setStatus(Registration.REGISTERED)
  }

  const onVote = async (voteId?: string): Promise<void> => {
    nav.go(pollResultsVote(voteId))
  }

  const startDate = new Date(poll?.createdAt ?? new Date())
  const endDate = new Date(
    poll == null
      ? new Date()
      : poll.status === PollStatus.PUBLISHED
        ? poll.registrationEnd
        : poll.endDate
  )

  return <WebContext.Provider value={context}>
    <Grid container direction="row" justifyContent="space-between" alignItems="stretch"
      sx={{ [theme.breakpoints.down('md')]: { display: 'none' } }}>
      <Grid item xs={2}>
        {org?.logoUrl != null
          ? <Avatar sx={{
            width: 100, height: 100,
            [theme.breakpoints.down('md')]: { width: 50, height: 50 }
          }} variant="square" src={org?.logoUrl} />
          : <Avatar sx={{
            width: 100, height: 100,
            [theme.breakpoints.down('md')]: { width: 50, height: 50 }
          }} variant="square">{org?.name.charAt(0)}</Avatar>}
      </Grid>
      <Grid item xs={10}>
        <Typography variant="h5">{org?.name}</Typography>
        <Typography variant="body1">{org?.shortDescr}</Typography>
      </Grid>
    </Grid>
    <Paper sx={{ width: '100%', mt: 1 }}>
      <Card>
        <CardHeader sx={{ ...paddingStyle, pt: 3, pb: isWrapped ? 1 : undefined }} disableTypography
          title={<Typography variant="h6" color="primary">{poll?.title}</Typography>}
          subheader={<Box>
            <Typography variant="body2">
              {smallScreen ? startDate.toLocaleDateString() : startDate.toLocaleString()}
              —
              {smallScreen ? endDate.toLocaleDateString() : endDate.toLocaleString()}
            </Typography>
            {poll?.header != null && poll.header != '' && !isWrapped ? <Typography variant="subtitle2">{poll.header}</Typography> : undefined}
          </Box>}
        />
        <Navigator navigation={nav}>
          <Screen screen={POLL_VIEW_REGISTRATION}>
            <PollViewRegistration poll={poll as Poll} status={status} onRegister={onRegister} />
          </Screen>
          <Screen screen={POLL_VIEW_VOTE}>
            <PollViewVote poll={poll as Poll} onVote={onVote} onInfo={onVote} skipSuccess />
          </Screen>
          <Screen screen={POLL_VIEW_INFO}>
            <PollViewInfo poll={poll as Poll} vote={async () => { nav.go(pollViewVote()) }} />
          </Screen>
          <Screen screen={POLL_RESULTS_INFO} render={
            view => <PollViewResults poll={poll as Poll} voteId={view.params.voteId} />
          } />
        </Navigator>
      </Card>
    </Paper>
  </WebContext.Provider>
}

export interface PollViewProps<C extends Context = Context> {
  context?: C
  id: string
}
