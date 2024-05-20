import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import DisabledByDefaultIcon from '@mui/icons-material/DisabledByDefault'
import ArrowForwardIosOutlinedIcon from '@mui/icons-material/ArrowForwardIosOutlined'
import { type FunctionComponent } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { type EditForm, type PollChoiceProps } from './types'
import { useTranslation } from 'react-i18next'
import { RENDERER_PARTY } from '@smartapps-poll/common'
import { MemberAvatarInput } from './fields/avatar'
import { isStatusEditable } from './utils'

export const QuestionChoice: FunctionComponent<PollChoiceProps> = ({ parent, index, poll, remove }) => {
  const { control } = useFormContext<EditForm>()
  const { t } = useTranslation(undefined, { keyPrefix: 'manager.poll.choice' })
  const disabled = isStatusEditable(poll)
  return <Grid item container direction="column" justifyContent="center" alignItems="stretch">
    <Grid item container direction="row" justifyContent="space-between" alignItems="stretch" p={1}>
      <Grid item container xs={1} justifyContent="center" alignItems="center">
        <ArrowForwardIosOutlinedIcon fontSize="small" />
      </Grid>
      <Grid item xs={10}>
        <Controller control={control} name={`questions.${parent}.choices.${index}.title`} defaultValue=''
          rules={{ required: t('error.required') ?? '' }} render={({ field, fieldState: state }) =>
            <TextField {...field} size="small" fullWidth disabled={disabled}
              label={state.invalid ? state.error?.message : t('fields.title')} error={state.invalid} />
          } />
      </Grid>
      <Grid item container xs={1} justifyContent="center" alignItems="center">
        {index === 0 || disabled === true
          ? undefined
          : <IconButton size="large" onClick={() => { remove(index) }}>
            <DisabledByDefaultIcon fontSize="inherit" color="info" />
          </IconButton>}
      </Grid>
    </Grid>
    {(() => {
        switch (poll.uiType) {
          case RENDERER_PARTY:
            return <MemberAvatarInput parent={parent} index={index} poll={poll} />
        }
        return undefined
      })()}
  </Grid>
}
