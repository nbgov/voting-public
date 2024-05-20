import type { FC } from 'react'
import type { MemberAvaterProps } from './types'
import Grid from '@mui/material/Grid'
import { type PartyChoice } from '@smartapps-poll/common'
import { Controller, useFormContext } from 'react-hook-form'
import { EditForm } from '../types'
import TextField from '@mui/material/TextField'
import { useTranslation } from 'react-i18next'
import { isStatusEditable } from '../utils'

export const MemberAvatarInput: FC<MemberAvaterProps<PartyChoice>> = ({ parent, index, poll }) => {
  const { t } = useTranslation(undefined, { keyPrefix: 'manager.poll.choice' })
  const { control, register, watch } = useFormContext<EditForm<PartyChoice>>()
  const type = watch(`questions.${parent}.choices.${index}.meta.avatar.type`)
  const disabled = isStatusEditable(poll)
  return <Grid item container direction="row" justifyContent="space-between" alignItems="stretch" p={1}>
    <Grid item container xs={1} justifyContent="center" alignItems="center"></Grid>
    <Grid item xs={10}>
      <input type="hidden" {...register(`questions.${parent}.choices.${index}.meta.avatar.type`)} value={type} />
      <Controller control={control} name={`questions.${parent}.choices.${index}.meta.avatar.fullUrl`} defaultValue=''
        rules={{ required: t('error.required') ?? '' }} render={({ field, fieldState: state }) =>
          <TextField {...field} size="small" fullWidth disabled={disabled}
            label={state.invalid ? state.error?.message : t('fields.avatarUrl')} error={state.invalid} />
        } />
    </Grid>
    <Grid item container xs={1} justifyContent="center" alignItems="center"></Grid>
  </Grid>
}
