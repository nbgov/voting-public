import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardActions from '@mui/material/CardActions'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Stack from '@mui/material/Stack'
import { type FunctionComponent, useEffect, useState } from 'react'
import { useCtx } from '../../context'
import {
  type Pagination, type Poll, PollStatus, fillPagination, getEndDateInterval, getRegistrationEndInterval, getStartDateInterval
} from '@smartapps-poll/common'
import Box from '@mui/material/Box'
import { default as Pager } from '@mui/material/Pagination' // eslint-disable-line
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import { useTranslation } from 'react-i18next'
import HourglassBottomIcon from '@mui/icons-material/HourglassBottom'
import { grey } from '@mui/material/colors'
import type { LoadableScreen } from '@smartapps-poll/web-common'

export const PublicPollList: FunctionComponent<PublicPollListProps & LoadableScreen> = ({ open, readyHandler }) => {
  const { t } = useTranslation(undefined, { keyPrefix: 'shared.poll.list' })
  const ctx = useCtx()
  const [polls, setPolls] = useState<Poll[]>([])
  const [pager, setPager] = useState<Pagination>(fillPagination())
  useEffect(() => {
    void (async () => {
      const result = await ctx.web.polls.listAll(pager, ctx.strategy.creds().getType())
      readyHandler?.ready != null && readyHandler.ready()
      if (result != null) {
        setPager(result.pager)
        setPolls(result.list)
      }
    })()
  }, [pager.page, pager.size, pager.total])

  return <Box width="95%" >
    <Stack direction="column" justifyContent="flex-start" alignItems="stretch" spacing={2}>
      {polls.map(poll => {
        const color = {
          [PollStatus.UNPUBLISHED]: grey['50'],
          [PollStatus.PUBLISHED]: '#8E7DB8', //amber['A100'],
          [PollStatus.STARTED]: '#C987BA', // lightGreen['50'],
          [PollStatus.CANCELED]: grey['50'],
          [PollStatus.PAUSED]: '#AB8D6C', // orange['A100'],
          [PollStatus.FINISHED]: '#C0C337', //lightBlue['A100']
        }[poll.status]
        const title = (poll.code != null && poll.code.trim() != '' ? poll.code + ' ' : '') + poll.title
        return <Card key={poll._id}>
          <CardActionArea onClick={() => { void open(poll._id) }}>
            <CardHeader title={title} />
            <CardContent>
              <Typography variant="body2">{
                poll.header != null && poll.header !== ''
                  ? poll.header
                  : ((poll.description?.substring(0, 400) ?? '') + (
                    (poll.description?.length ?? 0) > 400 ? '...' : ''
                  ))}</Typography>
            </CardContent>
          </CardActionArea>
          <CardActions sx={{ backgroundColor: color }}>
            <Grid container direction="row" justifyContent="space-between" alignItems="baseline">
              <Grid item xs={6}>
                <Typography variant="subtitle1">{t(`status.${poll.status === PollStatus.PUBLISHED && !poll.strictRegistration
                  ? PollStatus.UNPUBLISHED
                  : poll.status
                  }`)}</Typography>
                <Typography noWrap variant="subtitle2">{t('createdAt', { createdAt: new Date(poll.createdAt).toLocaleString() })}</Typography>
              </Grid>
              <Grid item container xs={6} direction="row" justifyContent="space-around" alignItems="stretch" columnSpacing={1}>
                {(() => {
                  switch (poll.status) {
                    case PollStatus.UNPUBLISHED:
                    case PollStatus.PUBLISHED: {
                      const beforeRegEnds = getRegistrationEndInterval(poll)
                      if (beforeRegEnds.asSeconds() < 0 || !poll.strictRegistration) {
                        const beforeStarts = getStartDateInterval(poll)
                        return <>
                          <Grid item xs={8} textAlign="end">
                            <Typography variant="body2">{t('interval.startDate')}</Typography>
                          </Grid>
                          <Grid item xs={4}>
                            <Typography variant="body2"><HourglassBottomIcon fontSize="inherit" /> {beforeStarts.humanize()}</Typography>
                          </Grid>
                        </>
                      }

                      return <>
                        <Grid item xs={8} textAlign="end">
                          <Typography variant="body2">{t('interval.registrationEnd')}</Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography variant="body2"><HourglassBottomIcon fontSize="inherit" /> {beforeRegEnds.humanize()}</Typography>
                        </Grid>
                      </>
                    }
                    case PollStatus.STARTED:
                    case PollStatus.PAUSED: {
                      const beforeEnds = getEndDateInterval(poll)
                      return <>
                        <Grid item xs={8} textAlign="end">
                          <Typography variant="body2">{t('interval.endDate')}</Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography variant="body2"><HourglassBottomIcon fontSize="inherit" /> {beforeEnds.humanize()}</Typography>
                        </Grid>
                      </>
                    }
                  }
                  return <></>
                })()}
              </Grid>
            </Grid>
          </CardActions>
        </Card>
      })}
      <Pager variant="outlined" shape="rounded" color="primary"
        count={Math.ceil((pager.total ?? 1) / pager.size)} defaultPage={pager.page + 1}
        page={pager.page + 1} onChange={(_, page) => {
          setPager({ page: page - 1, size: pager.size, total: pager.total })
        }} />
    </Stack>
  </Box>
}

export interface PublicPollListProps {
  open: (id: string) => Promise<void>
}
