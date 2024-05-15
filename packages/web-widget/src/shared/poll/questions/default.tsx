import CheckIcon from '@mui/icons-material/Check'
import { type FunctionComponent } from 'react'
import Grid from '@mui/material/Grid'
import { type FieldArrayWithId, useController, useFieldArray, useFormContext } from 'react-hook-form'
import { type VoteForm } from '../types'
import Typography from '@mui/material/Typography'
import FormControl from '@mui/material/FormControl'
import RadioGroup from '@mui/material/RadioGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import Radio from '@mui/material/Radio'
import { type ChoiceResult, PollStatus } from '@smartapps-poll/common'
import Alert from '@mui/material/Alert'
import { useTranslation } from 'react-i18next'
import { useSmallStyles } from '../../helpers'
import Stack from '@mui/material/Stack'
import { buildAnalytics, type IChoice } from '@smartapps-poll/web-common'
import type { PollQuestionProps } from './types'
import { useCtx } from '../../context'

export const DefaultPollQuestion: FunctionComponent<PollQuestionProps> = ({ field, index, poll }) => {
  const ctx = useCtx()
  const analytics = buildAnalytics(ctx)
  const { control, setValue, trigger } = useFormContext<VoteForm>()
  const fontStyleModifier = useSmallStyles({}, { fontSize: '0.5em', lineHeight: '1em' })
  const { t } = useTranslation(undefined, { keyPrefix: 'shared.poll.questions' })
  const { fields: choices } = useFieldArray<VoteForm>({ control, name: `questions.${index}.choices` })

  const isOngoingPoll = poll.status === PollStatus.STARTED
  const isVotingContext = choices != null && choices.length != 0
  const controller = useController({
    control,
    name: `questions.${index}.choices`,
    rules: isOngoingPoll && isVotingContext ? {
      validate: values => values.some(choice => choice.selected) ? true : 'Question should be answered'
    } : undefined
  })

  return <Grid item container direction="column" justifyContent="center" alignItems="stretch" p={1} px={0}>
    <Grid item container direction="row" justifyContent="space-between" alignItems="stretch" px={0} pt={1}>
      <Grid item xs={12}>
        <Typography variant="subtitle1" fontWeight="bold">{field.title}</Typography>
      </Grid>
    </Grid>
    <Grid item container direction="row" justifyContent="space-between" alignItems="stretch" px={0}>
      <Grid item xs={12}>
        <Typography variant="body2" gutterBottom>{field.description}</Typography>
      </Grid>
    </Grid>
    <Grid item container direction="row" justifyContent="space-between" alignItems="stretch" px={0} py={2}>
      <Grid item container xs={12}>
        {isOngoingPoll && isVotingContext
          ? <FormControl>
            {controller.fieldState.invalid
              ? <Alert title={t('error.title') ?? ''} severity="error">
                <Typography variant="body1">{controller.fieldState.error?.message ?? t('error.choice')}</Typography>
              </Alert>
              : undefined}
            <RadioGroup name={controller.field.name} onChange={(_, value) => {
              analytics.log('choice', { initial: controller.field.value.some(value => value.selected) ? 'no' : 'yes', style: 'default', poll: poll._id })
              const _choices = choices as Array<FieldArrayWithId<VoteForm, 'questions.0.choices'>>
              setValue(`questions.${index}.choices`, _choices.map(
                choice => ({ ...choice, selected: choice.value === parseInt(value) })
              ))
              if (trigger != null) void trigger(`questions.${index}.choices`)
            }}>
              {choices.map(_field => {
                const field = _field as FieldArrayWithId<VoteForm, 'questions.0.choices'>
                return <FormControlLabel key={field.id} value={field.value} label={field.title} control={<Radio />} />
              })}
            </RadioGroup>
          </FormControl>
          : <Grid item container direction="column" justifyContent="space-evenly" alignItems="stretch" rowSpacing={1}>
            {(choices.length === 0 ? field.choices : choices).map((choiceField, index) => {
              const _field = { ...field.choices[index], ...choiceField as IChoice }
              const result = 'result' in _field ? (_field as unknown as ChoiceResult) : undefined
              const id = (choiceField as any).id ?? `${index}`

              return <Grid key={id} item container direction="row" justifyContent="space-between" alignItems="stretch">
                <Grid item xs={7}>
                  <Typography variant="subtitle2">{`${_field.value + 1}`}. {choiceField.title}</Typography>
                </Grid>
                {result != null
                  ? <Grid item xs={4}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography>{result.result}&nbsp;</Typography>
                      <Typography sx={fontStyleModifier}>
                        {
                          result.share != null && result.share !== 0 && !Number.isNaN(result.share)
                            ? ` (${parseFloat(`${result.share * 100}`).toFixed(2)}%)`
                            : ''
                        }
                        {result?.winner === true && !isOngoingPoll ? ` - ${t('status.winner')}` : ''}
                      </Typography>
                    </Stack>
                  </Grid>
                  : undefined}
                <Grid item xs={1}>
                  {_field.selected ? <CheckIcon fontSize="large" color="primary" /> : undefined}
                </Grid>
              </Grid>
            })}
          </Grid>
        }
      </Grid>
    </Grid>
  </Grid >
}
