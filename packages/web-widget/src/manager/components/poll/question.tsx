import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import DisabledByDefaultIcon from '@mui/icons-material/DisabledByDefault'
import QuestionMarkIcon from '@mui/icons-material/QuestionMark'
import { type FunctionComponent } from 'react'
import { Controller, useFieldArray, useFormContext } from 'react-hook-form'
import { QuestionChoice } from './choice'
import { type EditForm, type PollQuestionProps } from './types'
import IconButton from '@mui/material/IconButton'
import { POLL_CHOICE_MAX, prepareEmptyChoice } from '@smartapps-poll/common'
import { useTranslation } from 'react-i18next'
import { isStatusEditable } from './utils'

export const PollQuestion: FunctionComponent<PollQuestionProps> = ({ poll, index, remove }) => {
  const { t } = useTranslation(undefined, { keyPrefix: 'manager.poll.question' })
  const { control } = useFormContext<EditForm>()
  const { fields: choices, append: appendChoice, remove: removeChoice } = useFieldArray<EditForm>(
    { control, name: `questions.${index}.choices` }
  )
  const disabled = isStatusEditable(poll)
  return <Grid item container direction="column" justifyContent="center" alignItems="stretch" p={2}>
    <Grid item container direction="row" justifyContent="space-between" alignItems="stretch" p={1}>
      <Grid item container xs={1} justifyContent="center" alignItems="center">
        <QuestionMarkIcon fontSize="large" color="primary" />
      </Grid>
      <Grid item xs={10}>
        <Controller control={control} name={`questions.${index}.title`} defaultValue=''
          rules={{ required: t('error.title') ?? '' }}
          render={({ field, fieldState: state }) =>
            <TextField {...field} fullWidth error={state.invalid} disabled={disabled}
              label={state.invalid ? state.error?.message : t('fields.title')} />
          } />
      </Grid>
      <Grid item container xs={1} justifyContent="center" alignItems="center">
        {index === 0 || disabled === true
          ? undefined
          : <IconButton size="large" onClick={() => { remove(index) }}>
            <DisabledByDefaultIcon fontSize="inherit" color="secondary" />
          </IconButton>}
      </Grid>
    </Grid>
    <Grid item container direction="row" justifyContent="space-between" alignItems="stretch" p={1}>
      <Grid item xs={1} />
      <Grid item xs={10}>
        <Controller control={control} name={`questions.${index}.description`} defaultValue=''
          render={({ field, fieldState: state }) =>
            <TextField {...field} fullWidth multiline minRows={2} maxRows={4} disabled={disabled}
              label={state.invalid ? state.error?.message : t('fields.descr')} error={state.invalid} />
          } />
      </Grid>
      <Grid item xs={1} />
    </Grid>
    <Grid item container direction="column" justifyContent="center" alignItems="stretch">
      {choices.map((field, idx) =>
        <QuestionChoice key={field.id} field={field} parent={index} index={idx} poll={poll}
          remove={removeChoice} />
      )}
      <Grid item container p={1} direction="column" alignItems="flex-end">
        <Button variant="outlined" disabled={disabled === true || choices.length >= POLL_CHOICE_MAX} onClick={() => {
          appendChoice(prepareEmptyChoice(poll, choices.length))
        }}>{t('actions.add')}</Button>
      </Grid>
    </Grid>
  </Grid >
}
