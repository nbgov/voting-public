import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import RemoveIcon from '@mui/icons-material/Remove'
import { type FunctionComponent } from 'react'
import { type PollRegistrationInfo } from '@smartapps-poll/common'
import { useTranslation } from 'react-i18next'

export const PollViewCensusInfo: FunctionComponent<PollViewCensusInfoProps> = ({ status }) => {
  const { t } = useTranslation(undefined, { keyPrefix: 'shared.poll.censusInfo' })
  return <Grid item container direction="column" justifyContent="center" alignItems="stretch" p={2}>
    <Grid item container direction="row" columns={5} justifyContent="flex-start" alignItems="stretch" p={1}>
      <Grid item xs={1}></Grid>
      <Grid item xs={3}><Typography variant="body2">{t('status.verification')}</Typography></Grid>
      <Grid item xs={1}>
        {status.valid ? <CheckIcon fontSize="large" color="success" /> : <CloseIcon fontSize="large" color="error" />}
      </Grid>
    </Grid>
    <Grid item container direction="row" columns={5} justifyContent="flex-start" alignItems="stretch" p={1}>
      <Grid item xs={1}></Grid>
      <Grid item xs={3}><Typography variant="body2">{t('status.registered')}</Typography></Grid>
      <Grid item xs={1}>
        {status.exists ? <CheckIcon fontSize="large" color="success" /> : <CloseIcon fontSize="large" color="error" />}
      </Grid>
    </Grid>
    {status.voted
      ? <Grid item container direction="row" columns={5} justifyContent="flex-start" alignItems="stretch" p={1}>
        <Grid item xs={1}></Grid>
        <Grid item xs={3}><Typography variant="body2">{t('status.voted')}</Typography></Grid>
        <Grid item xs={1}><CheckIcon fontSize="large" color="success" /></Grid>
      </Grid>
      : undefined}
    <Grid item container direction="row" columns={5} justifyContent="flex-start" alignItems="stretch" p={1}>
      <Grid item xs={1}></Grid>
      <Grid item xs={3}><Typography variant="body2">{t('status.allowed')}</Typography></Grid>
      <Grid item xs={1}>
        {status.allowed
          ? <CheckIcon fontSize="large" color="success" />
          : status.voted
            ? <RemoveIcon fontSize="large" color="success" />
            : <CloseIcon fontSize="large" color="error" />}
      </Grid>
    </Grid>
  </Grid>
}

export interface PollViewCensusInfoProps {
  status: PollRegistrationInfo
}
