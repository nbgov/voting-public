import Grid from '@mui/material/Grid'
import Step from '@mui/material/Step'
import StepContent from '@mui/material/StepContent'
import StepLabel from '@mui/material/StepLabel'
import Stepper from '@mui/material/Stepper'
import Typography from '@mui/material/Typography'
import { type Poll, type PollInfo, PollStatus } from '@smartapps-poll/common'
import { type FunctionComponent, type PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'

export const PollSteps: FunctionComponent<PropsWithChildren<PollStepsProps>> = ({ poll, children }) => {
  const { t } = useTranslation(undefined, { keyPrefix: 'manager.poll.steps' })
  const step = {
    [PollStatus.UNPUBLISHED]: 0,
    [PollStatus.PUBLISHED]: 1,
    [PollStatus.STARTED]: 2,
    [PollStatus.PAUSED]: 2,
    [PollStatus.FINISHED]: 3,
    [PollStatus.CANCELED]: 3
  }[poll.status] ?? 0

  return <Grid item container direction="row" justifyContent="space-between" alignItems="stretch">
    <Grid item container xs={9} minHeight={600} direction="column" justifyContent="flex-start" alignItems="stretch">
      {children}
    </Grid>
    <Grid item container xs={3} bgcolor="info.dark" p={2} direction="column" justifyContent="flex-start" alignItems="stretch">
      <Grid item container xs={1} minWidth={100} direction="column" justifyContent="flex-end" alignItems="stretch">
        <Grid item>
          <Typography variant="h4" gutterBottom color="white">{t('header')}</Typography>
        </Grid>
      </Grid>
      <Grid item container minWidth={100} direction="column" justifyContent="flex-start" alignItems="stretch">
        <Grid item>
          <Stepper orientation="vertical" activeStep={step}>
            <Step>
              <StepLabel>
                <Typography variant="body1" color="white">{t('title1')}</Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="white">{t('descr1')}</Typography>
              </StepContent>
            </Step>
            <Step>
              <StepLabel>
                <Typography variant="body1" color="white">{t('title2')}</Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="white">{t('descr2')}</Typography>
              </StepContent>
            </Step>
            <Step>
              <StepLabel>
                <Typography variant="body1" color="white">{t('title3')}</Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="white">{t('descr3')}</Typography>
              </StepContent>
            </Step>
            <Step>
              <StepLabel>
                <Typography variant="body1" color="white">{t('title4')}</Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="white">{t('descr4')}</Typography>
              </StepContent>
            </Step>
          </Stepper>
        </Grid>
      </Grid>
    </Grid>
  </Grid>
}

export interface PollStepsProps {
  poll: Poll | PollInfo
}
