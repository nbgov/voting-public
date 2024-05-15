import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import { type Poll, type PollRegistrationInfo } from '@smartapps-poll/common'
import { type FunctionComponent, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { type VoteForm } from './types'
import { useCtx } from '../context'
import { ProgressButton, ProofspaceAuthChoiceAsync, ProofspaceIntegratedAuthAsync, useToggle } from '@smartapps-poll/web-common'
import CardActions from '@mui/material/CardActions'
import Button from '@mui/material/Button'
import { PollViewCensusInfo } from './census-info'
import { useTranslation } from 'react-i18next'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Paper from '@mui/material/Paper'
import { PollQuestion } from './questions'

export const PollViewInfo: FunctionComponent<PollViewInfoProps> = ({ poll, vote }) => {
  const context = useCtx()
  const { t } = useTranslation(undefined, { keyPrefix: 'shared.poll.info' })
  const toggle = useToggle(true)
  const auth = useToggle(false)
  const { control } = useForm<VoteForm>({ values: poll as unknown as VoteForm })
  const { fields: questions } = useFieldArray({ control, name: 'questions' })
  const [status, setStatus] = useState<PollRegistrationInfo | undefined>(undefined)

  const afterAuth = async (): Promise<void> => {
    try {
      await check()
    } catch (e) {
      console.error(e)
    } finally {
      auth.close()
      toggle.open()
    }
  }

  const check = async (): Promise<void> => {
    try {
      const state = await context.strategy.service().poll.check(poll)
      setStatus(state)
    } catch (e) {
      console.error(e)
    }
  }

  const tryCheck = async (): Promise<void> => {
    try {
      toggle.close()
      if (context.isAuthenticated()) {
        await check()
      } else {
        auth.open()
      }
    } catch (e) {
      console.error(e)
    } finally {
      toggle.open()
    }
  }

  return <>
    {auth.opened
      ? <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {
          (context.integration != null)
            ? <ProofspaceIntegratedAuthAsync skipSuccess onSuccess={afterAuth} />
            : <ProofspaceAuthChoiceAsync skipSuccess onSuccess={afterAuth} />
        }
      </CardContent>
      : <CardContent sx={{ px: 3 }}>
        <Grid container direction="row" justifyContent="space-between" alignItems="flex-start" columnSpacing={3}>
          <Grid item sm={8} xs={12} mb={1}>
            <Typography variant="body1" gutterBottom mb={2}>{poll.description}</Typography>
            <Paper>
              {status != null ? <PollViewCensusInfo status={status} /> : undefined}
              {questions.map(
                (field, index) => <PollQuestion key={field.id} field={field} index={index} poll={poll} />
              )}
            </Paper>
          </Grid>
          <Grid item sm={4} xs={12}>
            <Card>
              <CardHeader title={t('actions.title')}
                titleTypographyProps={{ variant: 'body1', fontWeight: 'bold' }} />
              <CardContent>
                <Typography variant="body2" fontSize="small" gutterBottom mb={2}>
                  {t('actions.description')}
                </Typography>
              </CardContent>
              {auth.opened
                ? undefined
                : <CardActions sx={{ justifyContent: 'center', flexDirection: 'column', px: 2 }}>
                  {status?.allowed === true
                    ? <Button size="large" fullWidth variant="contained" onClick={() => { void vote() }}>{t('actions.vote')}</Button>
                    : undefined
                  }
                  <ProgressButton size="large" fullWidth toggle={toggle} onClick={tryCheck}>
                    {status != null ? t('actions.recheck') : t('actions.check')}
                  </ProgressButton>
                </CardActions>}
            </Card>
          </Grid>
        </Grid>
      </CardContent>
    }
  </>
}

export interface PollViewInfoProps {
  poll: Poll
  vote: () => Promise<void>
}
