import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardActions from '@mui/material/CardActions'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import TextField from '@mui/material/TextField'
import { ProgressButton, ResultBox, ResultBoxStatus, useToggle } from '@smartapps-poll/web-common'
import { type FunctionComponent, useEffect, useState } from 'react'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import { useCtx } from '../../../shared'
import { useTranslation } from 'react-i18next'
import { type Census, DEFAULT_CRED_SOURCE, LocalizedError, SKIP_CRED_SOURCE, RENDERER_DEFAULT, RENDERER_PARTY } from '@smartapps-poll/common'
import { type PollCreationForm } from './types'
import { CensusFilter } from './filter'
import { makeCodeValidationRules, populateRequiredProofs } from './utils'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'

export const PollCreation: FunctionComponent<PollCreationProps> = ({ onSuccess, onCancel }) => {
  const { t } = useTranslation(undefined, { keyPrefix: 'manager.poll.creation' })
  const ctx = useCtx()
  const methods = useForm<PollCreationForm>({
    mode: 'onChange',
    defaultValues: {
      title: '', code: '', requiredProofs: [''], proofGuideUrl: '', uiType: false, census: { type: '', size: 1 },
      credSources: [DEFAULT_CRED_SOURCE, SKIP_CRED_SOURCE], allowWebPass: false,
      tg: { requireId: undefined, botUrl: '', validators: [] }
    }
  })
  const { control, handleSubmit, watch, trigger } = methods
  const [status, setStatus] = useState<ResultBoxStatus>(ResultBoxStatus.READY)
  const [error, setError] = useState<Error>(new Error('unknown'))
  const [pollId, setPollId] = useState<string | undefined>(undefined)
  const toggle = useToggle(true)

  const create = async (data: PollCreationForm): Promise<void> => {
    try {
      toggle.close()
      const poll = await ctx.web.polls.create({
        title: data.title,
        code: data.code,
        uiType: data.uiType ? RENDERER_PARTY : RENDERER_DEFAULT,
        census: data.census as Census,
        ...populateRequiredProofs(ctx, data)
      })
      if (poll == null) {
        throw new LocalizedError('poll.manager.create')
      }
      setPollId(poll._id)
      setStatus(ResultBoxStatus.SUCCESS)
    } catch (e) {
      if (e instanceof Error) {
        setError(e)
      } else {
        setError(new LocalizedError(`${e?.toString() ?? ''}`))
      }
      setStatus(ResultBoxStatus.ERROR)
    } finally {
      toggle.open()
    }
  }

  useEffect(() => { void success() }, [status, pollId])
  const success = async (): Promise<void> => {
    if (pollId != null && status === ResultBoxStatus.SUCCESS) {
      await onSuccess(pollId)
    }
  }

  const retry = async (): Promise<void> => {
    setStatus(ResultBoxStatus.READY)
    setPollId(undefined)
  }

  const requiredProofs = watch('requiredProofs')

  return <ResultBox fullWidth status={status} error={error} retry={() => { void retry() }} onSuccess={success} msg={{
    success: t('result.success'), error: t('result.error')
  }}><Card sx={{ width: '100%' }}>
      <CardHeader title={t('header')} />
      <CardContent>
        <Controller control={control} name="title" rules={{ required: t('error.title') ?? '' }}
          render={({ field, fieldState }) => (
            <FormControl fullWidth sx={{ mb: 2 }}>
              <TextField {...field} fullWidth label={t('fields.title')} error={fieldState.invalid} />
              <FormHelperText error={fieldState.invalid}>
                {fieldState.error?.message ?? t('hint.title')}
              </FormHelperText>
            </FormControl>
          )} />
        <Controller control={control} name="code" rules={makeCodeValidationRules(t)} render={({ field, fieldState }) => (
          <FormControl fullWidth sx={{ mb: 2 }}>
            <TextField {...field} fullWidth label={t('fields.code')} error={fieldState.invalid} />
            <FormHelperText error={fieldState.invalid}>
              {fieldState.error?.message ?? t('hint.code')}
            </FormHelperText>
          </FormControl>
        )} />
        <FormProvider {...methods}>
          <CensusFilter />
        </FormProvider>
        <Controller control={control} name="proofGuideUrl" rules={
          requiredProofs.some(proof => proof != null && proof != '') ? { required: t('error.title') ?? '' } : {}
        } render={({ field, fieldState }) => (
          <TextField {...field} fullWidth label={t('fields.proofGuideUrl')} error={fieldState.invalid}
            helperText={fieldState.error?.message ?? t('hint.proofGuideUrl')} />
        )} />
        <Controller control={control} name="uiType" render={({ field }) => (
          <FormControl fullWidth>
            <FormControlLabel control={<Checkbox {...field} checked={field.value} value="true"
              onChange={e => {
                field.onChange(e.target.checked)
                trigger()
              }} />} {...field} label={t('fields.uiType')} />
            <FormHelperText >{t('hint.uiType')}</FormHelperText>
          </FormControl>
        )} />
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end' }}>
        <Button variant="outlined" size="large" onClick={() => { void onCancel() }}>{t('actions.cancel')}</Button>
        <ProgressButton size="large" toggle={toggle} onClick={handleSubmit(create)}>{t('actions.create')}</ProgressButton>
      </CardActions>
    </Card>
  </ResultBox>
}

export interface PollCreationProps {
  onCancel: () => Promise<void>
  onSuccess: (id: string) => Promise<void>
}
