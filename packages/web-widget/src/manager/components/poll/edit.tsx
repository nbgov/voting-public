import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardActions from '@mui/material/CardActions'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import { type PollInfo, PollStatus, POLL_QUESTION_MAX, type Poll, LocalizedError, isElectionEditable, CensusStatus, type Census, RENDERER_DEFAULT, prepareEmptyChoice, type RequiredProofAction } from '@smartapps-poll/common'
import { PollError, ProgressButton, ResultBox, ResultBoxStatus, useToggle } from '@smartapps-poll/web-common'
import days from 'dayjs'
import { type FunctionComponent, useEffect, useState } from 'react'
import { Controller, useFieldArray, useForm, FormProvider } from 'react-hook-form'
import { useCtx } from '../../../shared'
import { PollQuestion } from './question'
import { type EditForm } from './types'
import { PollShareBlock } from './share-block'
import { useTranslation } from 'react-i18next'
import { PollSteps } from './steps'
import Typography from '@mui/material/Typography'
import Link from '@mui/material/Link'
import { VocdoniCunsusSize } from '../vocdoni/cesnus-size'
import { buildEditFormData, isStatusEditable, makeCodeValidationRules } from './utils'
import { canStartVoting, isCspCensus, isPublishingRequired } from '../../../helpers'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'

const registrationEnd = days().add(7, 'day').toDate()
const startDate = days(registrationEnd).add(1, 'day').toDate()
const endDate = days(startDate).add(7, 'day').toDate()
const defaults: EditForm = {
  title: '',
  code: '',
  header: '',
  description: '',
  status: PollStatus.UNPUBLISHED,
  manual: true,
  strictRegistration: false,
  registrationEnd,
  startDate,
  endDate,
  questions: [],
  census: {
    size: 1,
    externalId: '',
    status: CensusStatus.UNPUBLISHED
  }
}

export const PollEdit: FunctionComponent<PollEditProps> = ({ id, onCancel, onSuccess }) => {
  const { t } = useTranslation(undefined, { keyPrefix: 'manager.poll.edit' })
  const ctx = useCtx()
  const [status, setStatus] = useState<ResultBoxStatus>(ResultBoxStatus.READY)
  const [error, setError] = useState<Error>(new LocalizedError('unknown'))
  const [poll, setPoll] = useState<PollInfo>({ _id: id } as unknown as PollInfo)
  const methods = useForm<EditForm>({
    values: poll,
    defaultValues: async () => {
      try {
        const poll = await ctx.web.polls.load(id, true)
        const _poll = (poll != null) ? buildEditFormData(poll) : poll
        if (_poll != null) {
          setPoll(_poll as PollInfo)
        }
        return { ..._poll } as EditForm
      } catch (e) {
        setStatus(ResultBoxStatus.ERROR)
        setError(e as Error)
      }
      return defaults
    }
  })

  const { control, handleSubmit, getValues } = methods

  useEffect(() => {
    void (async () => {
      try {
        const poll = await ctx.web.polls.load(id, true)
        const _poll = (poll != null) ? buildEditFormData(poll) : poll
        if (_poll != null) {
          setPoll(_poll as PollInfo)
        }
      } catch (e) {
        setStatus(ResultBoxStatus.ERROR)
        setError(e as Error)
      }
    })()
  }, [id])

  const toggle = useToggle(true)

  const _update = async (data: EditForm, status: PollStatus | undefined, error: string, success?: boolean): Promise<void> => {
    setStatus(ResultBoxStatus.READY)
    toggle.close()
    try {
      data = { ...data }
      if (status === PollStatus.STARTED && poll.status !== PollStatus.STARTED) {
        const estimate = await ctx.strategy.service().poll.estimate(poll)
        const balance = await ctx.strategy.service().account.getTokensCount()
        if (balance < estimate) {
          throw new PollError('account.balance.insufficient')
        }
      }
      const dataUpdate: Partial<PollInfo> = {
        ...(
          [PollStatus.UNPUBLISHED].includes(poll.status)
            ? {
              ...Object.fromEntries(Object.entries(data).filter(([key]) => key in defaults))
            }
            : {}
        ),
        ...(status != null ? { status } : {}),
        census: { size: data.census?.size } as Census
      }
      let update = await ctx.web.polls.update(dataUpdate, poll._id)
      if (update == null) {
        throw new PollError(error)
      }

      if (update.status === PollStatus.STARTED && poll.status !== PollStatus.STARTED) {
        const externalId = await ctx.strategy.service().poll.publish(update)
        update = await ctx.web.polls.update({ externalId }, poll._id)
        if (update == null) {
          throw new PollError(error)
        }
      }
      setPoll(update)
      setStatus(ResultBoxStatus.SUCCESS)
      if (success != null && success) {
        await onSuccess(update.status)
      }
    } catch (e) {
      console.error(e)
      setStatus(ResultBoxStatus.ERROR)
      setError(e as Error)
    } finally {
      toggle.open()
    }
  }

  const edit = async (data: EditForm): Promise<void> => { await _update(data, undefined, 'poll.manager.edit', true) }

  const publish = async (data: EditForm): Promise<void> => { await _update(data, PollStatus.PUBLISHED, 'poll.manager.publish') }

  const start = async (data: EditForm): Promise<void> => { await _update(data, PollStatus.STARTED, 'poll.manager.start', true) }

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

  const { fields: questions, append: appendQuestion, remove: removeQuestion } =
    useFieldArray({ control, name: 'questions' })

  return <Card sx={{ width: '100%' }}>
    <CardHeader title={t('header')} />
    <CardContent>
      <FormProvider {...methods}>
        <PollSteps poll={poll}>
          <Grid item container wrap="wrap" direction="row" justifyContent="center" alignItems="stretch">
            <ResultBox status={status} error={error} onSuccess={async () => {
              setStatus(ResultBoxStatus.READY)
              await onSuccess(poll.status)
            }} msg={{ success: t('result.success'), error: t('result.error') }} />
            <Grid item container xs={12} direction="column" justifyContent="space-evenly" alignItems="stretch">
              {poll.requiredProofs != null && poll.requiredProofs.length > 0
                ? (() => {
                  let info: RequiredProofAction
                  try {
                    info = ctx.strategy.creds().castProofInfo(poll.requiredProofs)
                  } catch {
                    const proof = poll.requiredProofs[0]
                    info = { ...proof }
                  }
                  return <Grid item p={1}>
                    <Typography variant="body2">{t('requiredProof.info')}</Typography>
                    <Typography variant="body1">{t('requiredProof.title')} {info.title}</Typography>
                    {info.guideUrl != null ? <Link href={info.guideUrl} target="_blank">{t('requiredProof.guide')} {info.guideUrl}</Link> : undefined}
                  </Grid>
                })()
                : undefined}
              {poll.uiType != null && poll.uiType !== RENDERER_DEFAULT
                ? <Grid item p={1}>
                  <Alert severity="warning">
                    <AlertTitle>{t(`alert.uiType.${poll.uiType}.title`)}</AlertTitle>
                    {t(`alert.uiType.${poll.uiType}.body`)}
                  </Alert>
                </Grid>
                : undefined}
              <Grid item p={1}>
                <Controller control={control} name="title" defaultValue=''
                  rules={{ required: t('error.title') ?? '' }}
                  render={({ field, fieldState: state }) =>
                    <TextField {...field} fullWidth error={state.invalid}
                      disabled={isStatusEditable(poll)}
                      label={state.invalid ? state.error?.message : t('fields.title')} />
                  } />
              </Grid>
              <Grid item p={1}>
                <Controller control={control} name="code" defaultValue=''
                  rules={makeCodeValidationRules(t)}
                  render={({ field, fieldState: state }) =>
                    <TextField {...field} fullWidth error={state.invalid}
                      disabled={isStatusEditable(poll)}
                      label={state.invalid ? state.error?.message : t('fields.code')} />
                  } />
              </Grid>
              <Grid item p={1}>
                <Controller control={control} name="header" defaultValue=''
                  rules={{ maxLength: { value: 120, message: t('error.headerLength') } }}
                  render={({ field, fieldState: state }) =>
                    <TextField {...field} fullWidth multiline minRows={1} maxRows={3} error={state.invalid}
                      disabled={isStatusEditable(poll)}
                      label={state.invalid ? state.error?.message : t('fields.header')} />
                  } />
              </Grid>
              <Grid item p={1}>
                <Controller control={control} name="description" defaultValue=''
                  rules={{ maxLength: { value: 2000, message: t('error.descrLength') } }}
                  render={({ field, fieldState: state }) =>
                    <TextField {...field} fullWidth multiline minRows={3} maxRows={9} error={state.invalid}
                      disabled={isStatusEditable(poll)}
                      label={state.invalid ? state.error?.message : t('fields.descr')} />
                  } />
              </Grid>
              {isCspCensus(poll) ? <Grid item p={1}>
                <VocdoniCunsusSize disabled={isStatusEditable(poll)} />
              </Grid> : undefined}
              <Grid item p={1}>
                <Controller control={control} name="registrationEnd" defaultValue={new Date()}
                  rules={{
                    validate: value => (!isElectionEditable(poll) ||
                      days(value).isAfter(days())) ?? t('error.registrationEnd')
                  }} render={({ field, fieldState: state }) =>
                    <DateTimePicker {...field} value={days(field.value)}
                      onChange={e => { field.onChange(e?.toDate()) }}
                      disabled={isStatusEditable(poll)}
                      label={state.invalid ? state.error?.message : t('fields.registrationEnd')}
                      minDateTime={days()}
                      slotProps={{ textField: { fullWidth: true, error: state.invalid } }} />
                  } />
              </Grid>
              <Grid item p={1}>
                <Controller control={control} name="startDate" defaultValue={new Date()}
                  rules={{
                    validate: (value, values) => (!isElectionEditable(poll) ||
                      days(value).isAfter(days(values.registrationEnd))) ?? t('error.startDate')
                  }} render={({ field, fieldState: state }) =>
                    <DateTimePicker {...field} value={days(field.value)}
                      onChange={e => { field.onChange(e?.toDate()) }}
                      disabled={isStatusEditable(poll)}
                      label={state.invalid ? state.error?.message : t('fields.startDate')}
                      minDateTime={days(getValues('registrationEnd'))}
                      slotProps={{ textField: { fullWidth: true, error: state.invalid } }} />
                  } />
              </Grid>
              <Grid item p={1}>
                <Controller control={control} name="endDate" defaultValue={new Date()}
                  rules={{
                    validate: (value, values) => (!isElectionEditable(poll) ||
                      days(value).isAfter(days(values.startDate))) ?? t('error.endDate')
                  }} render={({ field, fieldState: state }) =>
                    <DateTimePicker {...field} value={days(field.value)}
                      onChange={e => { field.onChange(e?.toDate()) }}
                      disabled={isStatusEditable(poll)}
                      label={state.invalid ? state.error?.message : t('fields.endDate')}
                      minDateTime={days(getValues('startDate'))}
                      slotProps={{ textField: { fullWidth: true, error: state.invalid } }} />
                  } />
              </Grid>
              <Grid item container direction="column" justifyContent="center" alignItems="stretch">
                {questions.map((field, index) =>
                  <PollQuestion key={field.id} field={field} index={index} remove={removeQuestion} poll={poll} />
                )}
                <Grid item p={1}>
                  <Button fullWidth variant="outlined"
                    disabled={isStatusEditable(poll) || questions.length >= POLL_QUESTION_MAX}
                    onClick={() => {
                      appendQuestion({ title: '', description: '', choices: [prepareEmptyChoice(poll, 0)] })
                    }}>{t('actions.add')}</Button>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </PollSteps>
      </FormProvider>
    </CardContent>
    <CardActions sx={{ justifyContent: 'flex-end' }}>
      <ProgressButton size="large" toggle={toggle} onClick={remove}>{t('actions.remove')}</ProgressButton>
      {
        isStatusEditable(poll)
          ? <PollShareBlock poll={poll as Poll} />
          : undefined
      }
      <Button variant="outlined" size="large" onClick={() => { void onCancel() }}>{t('actions.cancel')}</Button>
      {
        isPublishingRequired(poll)
          ? <ProgressButton size="large" variant="outlined" toggle={toggle}
            onClick={handleSubmit(publish)}>{t('actions.publish')}</ProgressButton>
          : undefined
      }
      {
        canStartVoting(poll)
          ? <ProgressButton size="large" toggle={toggle} onClick={handleSubmit(start)}>{t('actions.start')}</ProgressButton>
          : undefined
      }
      <ProgressButton size="large" toggle={toggle} onClick={handleSubmit(edit)}>{t('actions.update')}</ProgressButton>
    </CardActions>
  </Card>
}

export interface PollEditProps {
  id: string
  onCancel: () => Promise<void>
  onSuccess: (status: PollStatus) => Promise<void>
}
