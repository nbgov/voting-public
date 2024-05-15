import Box from '@mui/material/Box'
import LinearProgress from '@mui/material/LinearProgress'
import Typography from '@mui/material/Typography'
import { type PollInfo, RENDERER_PARTY, type PollResult } from '@smartapps-poll/common'
import { type FunctionComponent } from 'react'
import { useTranslation } from 'react-i18next'

export const PollViewVotedInfo: FunctionComponent<PollViewVotedInfoProps> = ({ results, poll }) => {
  const { t } = useTranslation(undefined, { keyPrefix: 'shared.poll.progress' })
  if (results == null || Object.keys(results).length === 0) {
    return <></>
  }

  switch (poll?.uiType) {
    case RENDERER_PARTY:
      return <Box mb={1}>
        <Typography variant="body1">{results.voteCount ?? 0}</Typography>
        <Typography variant="subtitle2" color="GrayText">{t('info')}</Typography>
      </Box>
  }

  return <Box mb={1}>
    <Typography variant="body1">{t('value', {
      count: results.voteCount ?? 0, size: results.census.size ?? 0
    })}</Typography>
    <Typography variant="subtitle2" color="GrayText">{t('info')}</Typography>
    <LinearProgress id="voting-progress" variant="determinate" value={
      Math.round(100 * (results.voteCount ?? 0) / (results.census.size ?? 1))
    } />
  </Box>
}

export interface PollViewVotedInfoProps {
  results?: PollResult
  poll?: PollInfo
}
