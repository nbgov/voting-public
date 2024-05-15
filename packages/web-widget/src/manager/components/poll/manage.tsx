import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Grid from '@mui/material/Grid'
import { PollError, ProgressButton, ResultBox, ResultBoxStatus, useToggle } from '@smartapps-poll/web-common'
import { type FunctionComponent, useEffect, useState } from 'react'
import { useCtx } from '../../../shared/context'
import { LocalizedError, type Poll, type PollResult, PollStatus, isElectionOnline, truncatePoll } from '@smartapps-poll/common'
import Typography from '@mui/material/Typography'
import CardActions from '@mui/material/CardActions'
import Button from '@mui/material/Button'
import { PollShareBlock } from './share-block'
import { useTranslation } from 'react-i18next'
import { PollSteps } from './steps'
import { FormProvider, useForm } from 'react-hook-form'
import { VoteForm } from '../../../shared/poll/types'
import { PollQuestion } from '../../../shared/poll/questions'

export const PollManage: FunctionComponent<PollManageProps> = ({ id, onCancel }) => {
  const { t } = useTranslation(undefined, { keyPrefix: 'manager.poll.manage' })
  const ctx = useCtx()
  const [status, setStatus] = useState<ResultBoxStatus>(ResultBoxStatus.READY)
  const [error, setError] = useState<Error>(new LocalizedError('unknown'))
  const [poll, setPoll] = useState<Poll>({ _id: id } as unknown as Poll)
  const [results, setResults] = useState<PollResult>({} as unknown as PollResult)
  const toggle = useToggle(true)
  const methods = useForm<VoteForm>()

  useEffect(() => {
    void (async () => {
      const poll = await ctx.web.polls.load(id, true)
      if (poll != null) {
        setPoll(truncatePoll(poll) as Poll)
        if (isElectionOnline(poll)) {
          const results = await ctx.strategy.service().poll.info(poll as Poll)
          setResults(results)
        }
      }
    })()
  }, [id])

  const finish = async (): Promise<void> => {
    setStatus(ResultBoxStatus.READY)
    toggle.close()
    try {
      const update = await ctx.web.polls.update({ status: PollStatus.FINISHED }, poll._id)
      if (update == null) {
        throw new PollError('poll.manager.finish')
      }

      const result = await ctx.strategy.service().poll.finish(poll)
      if (!result) {
        throw new PollError('poll.manager.vocodniFinish')
      }

      setPoll(update as Poll)
      setStatus(ResultBoxStatus.SUCCESS)
    } catch (e) {
      console.error(e)
      setStatus(ResultBoxStatus.ERROR)
      setError(e as Error)
    } finally {
      toggle.open()
    }
  }

  const remove = async (): Promise<void> => {
    try {
      toggle.close()
      const result = await ctx.web.polls.delete(poll)
      if (!result) {
        throw new PollError('error.poll.delete')
      }
      onCancel()
    } catch (e) {
      console.error(e)
      setStatus(ResultBoxStatus.ERROR)
      setError(e as Error)
    } finally {
      toggle.open()
    }
  }

  return <Card sx={{ width: '100%' }}>
    <CardHeader title={t('header')} />
    <CardContent>
      <PollSteps poll={poll}>
        <Grid item container wrap="wrap" direction="row" justifyContent="center" alignItems="stretch">
          <ResultBox status={status} error={error} onSuccess={async () => {
            setStatus(ResultBoxStatus.READY)
          }} msg={{ success: t('result.success'), error: t('result.error') }} />
          <Grid item container xs={12} direction="column" justifyContent="space-evenly" alignItems="stretch">
            <Grid item p={1}>
              <Typography variant="h4" gutterBottom>{poll.title}</Typography>
              <Typography variant="subtitle1" gutterBottom>{poll.header}</Typography>
              <Typography variant="body1" gutterBottom>{poll.description}</Typography>
            </Grid>
            <Grid item p={1}>
              <FormProvider {...methods}>
                {results?.questions?.map((field, index) => {
                  const id: string = (field as any).id ?? `${index}`
                  return <PollQuestion key={id} field={{ ...field, id }} index={index} poll={poll} />
                })}
              </FormProvider>
            </Grid>
          </Grid>
        </Grid>
      </PollSteps>
    </CardContent>
    <CardActions sx={{ justifyContent: 'flex-end' }}>
      <ProgressButton size="large" toggle={toggle} onClick={remove}>{t('actions.remove')}</ProgressButton>
      <PollShareBlock poll={poll} />
      {poll.status !== PollStatus.FINISHED
        ? <ProgressButton toggle={toggle} variant="outlined" size="large"
          onClick={finish}>{t('actions.finish')}</ProgressButton>
        : undefined}
      <Button variant="outlined" size="large" onClick={() => { void onCancel() }}>{t('actions.close')}</Button>
    </CardActions>
  </Card>
}

export interface PollManageProps {
  id: string
  onCancel: () => Promise<void>
  onSuccess: () => Promise<void>
}
