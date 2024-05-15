import type { FunctionComponent } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import { type PollCreationForm } from '../poll/types'

export const VocdoniCunsusSize: FunctionComponent<VocdoniCensusSizeProps> = ({ disabled }) => {
  const { t } = useTranslation(undefined, { keyPrefix: 'manager.census.filter' })
  const { control, trigger } = useFormContext<PollCreationForm>()

  return <Controller control={control} name="census.size" rules={{
    required: t('error.size.required') ?? '',
    min: { value: 1, message: t('error.size.min') },
    max: { value: Number.MAX_SAFE_INTEGER, message: t('error.size.max') },
    validate: value => ((value?.toString().match(/\D+/)) != null) ? (t('error.size.number') ?? '') : true
  }} render={({ field, fieldState }) => (
    <FormControl fullWidth sx={{ mb: 2 }}>
      <TextField {...field} fullWidth label={t('fields.size.label')} error={fieldState.invalid}
        onChange={args => {
          field.onChange(args)
          trigger('census.size')
        }} type="number" disabled={disabled} value={field.value ?? 0} />
      <FormHelperText error={fieldState.invalid}>
        {fieldState.error?.message ?? t('fields.size.hint')}
      </FormHelperText>
    </FormControl>
  )} />
}

export interface VocdoniCensusSizeProps {
  disabled?: boolean
}
