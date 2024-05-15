import CheckIcon from '@mui/icons-material/Check'
import { PollStatus, type PartyChoice, Question, ChoiceResult } from '@smartapps-poll/common'
import type { FC } from 'react'
import type { PollQuestionProps } from './types'
import Grid from '@mui/material/Grid'
import { FieldArrayWithId, useController, useFieldArray, useFormContext } from 'react-hook-form'
import type { VoteForm } from '../types'
import { useSmallStyles, useSmalllUI } from '../../helpers'
import { useTranslation } from 'react-i18next'
import Typography from '@mui/material/Typography'
import FormControl from '@mui/material/FormControl'
import Alert from '@mui/material/Alert'
import RadioGroup from '@mui/material/RadioGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import Radio from '@mui/material/Radio'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import Avatar from '@mui/material/Avatar'
import Stack from '@mui/material/Stack'
import { IChoice, buildAnalytics } from '@smartapps-poll/web-common'
import AvatarGroup from '@mui/material/AvatarGroup'
import { useCtx } from '../../context'
import useTheme from '@mui/material/styles/useTheme'
import useMediaQuery from '@mui/material/useMediaQuery'

export const PartyPollQuestions: FC<PollQuestionProps<PartyChoice>> = ({ poll, field, index }) => { // {index, field, poll}
  const ctx = useCtx()
  const analytics = buildAnalytics(ctx)
  const { control, setValue, trigger } = useFormContext<VoteForm>()
  const theme = useTheme()
  const avatarCount = useMediaQuery(theme.breakpoints.down(380)) ? 7 : 9
  const personModifier = useSmallStyles({ maxWidth: 150, m: 1 }, { maxWidth: 150 })
  const avatarModifier = useSmallStyles({ width: 100, height: 100 }, { width: 30, height: 30 })
  const fontModifier = useSmallStyles({ maxWidth: 125 }, { maxWidth: 60, fontSize: 10 })
  const wrapInfoModifier = useSmallStyles({}, { fontSize: 10 })
  const uiIsSmall = useSmalllUI()
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

  return <Grid container direction="column" justifyContent="center" alignItems="stretch" p={1} px={0}>
    {isOngoingPoll && isVotingContext
      ? <FormControl fullWidth>
        {controller.fieldState.invalid
          ? <Alert title={t('error.title') ?? ''} severity="error">
            <Typography variant="body1">{controller.fieldState.error?.message ?? t('error.choice')}</Typography>
          </Alert>
          : undefined}
        <RadioGroup name={controller.field.name} onChange={(_, value) => {
          analytics.log('choice', { initial: controller.field.value.some(value => value.selected) ? 'no' : 'yes', style: 'party', poll: poll._id })
          const _choices = choices as Array<FieldArrayWithId<VoteForm, 'questions.0.choices'>>
          setValue(`questions.${index}.choices`, _choices.map(
            choice => ({ ...choice, selected: choice.value === parseInt(value) })
          ))
          if (trigger != null) void trigger(`questions.${index}.choices`)
        }}>
          {choices.map((_field, idx) => {
            const field = _field as FieldArrayWithId<VoteForm, 'questions.0.choices'>
            const question = poll.questions?.find((_, _index) => _index === idx) as Question<PartyChoice>
            const items = question.choices
            return <Accordion key={field.value} disableGutters={true}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Grid container direction="column" justifyContent="flex-start" alignItems="stretch">
                  <Grid container item direction="row" justifyContent="space-between" alignItems="stretch">
                    <Grid item xs={8}>
                      <FormControlLabel value={field.value} label={field.title} control={
                        <Radio onClick={event => event.stopPropagation()} />
                      } />
                    </Grid>
                    <Grid item xs={4} textAlign="right">
                      <Typography variant="caption" noWrap sx={{ ...wrapInfoModifier }}>{t('party.unwrap')}</Typography>
                    </Grid>
                  </Grid>
                  <Grid item container direction="row" alignItems="stretch" justifyContent="flex-start" ml={'33px'}>
                    <AvatarGroup total={items.length} max={avatarCount} sx={{ '& .MuiAvatar-root': { width: 30, height: 30, fontSize: 12 } }}>
                      {items?.slice(0, avatarCount).map((item, idx) => {
                        return <Avatar key={'smalav' + idx.toString()} src={item.meta?.avatar.fullUrl} sx={{ height: 30, width: 30 }} />
                      })}
                    </AvatarGroup>
                  </Grid>
                </Grid>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" sx={{ pb: 2 }}>{question.description}</Typography>
                <Grid container direction="row" justifyContent={uiIsSmall ? "space-between" : "flex-start"} alignItems="stretch">
                  {items?.map((item, idx) => {
                    const key = `${field.value}.${idx}`
                    return <Grid key={key} item container direction={uiIsSmall ? "row" : "column"} xs={uiIsSmall ? 5 : undefined}
                      justifyContent="space-around" alignItems="stretch" sx={personModifier}>
                      <Grid item justifyContent="center" alignItems="center" container xs={uiIsSmall ? 4 : undefined}>
                        <Avatar src={item.meta?.avatar.fullUrl} sx={avatarModifier} />
                      </Grid>
                      <Grid item justifyContent={uiIsSmall ? "flex-start" : "center"} alignItems="center" container
                        xs={uiIsSmall ? 8 : undefined}>
                        <Typography sx={fontModifier} textAlign={uiIsSmall ? "start" : "center"}>{item.title}</Typography>
                      </Grid>
                    </Grid>
                  })}
                </Grid>
              </AccordionDetails>
            </Accordion>
          })}
        </RadioGroup>
      </FormControl>
      : <>
        {(choices.length === 0 ? field.choices : choices).map((choiceField, idx) => {
          const _field = { ...field.choices[idx], ...choiceField as IChoice } // choiceField as FieldArrayWithId<VoteForm, 'questions.0.choices'>
          const result = 'result' in _field ? (_field as unknown as ChoiceResult) : undefined
          const question = poll.questions?.find((_, _index) => _index === idx) as Question<PartyChoice>
          const items = question.choices

          return <Accordion key={_field.value}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Grid container direction="column" justifyContent="flex-start" alignItems="stretch">
                <Grid item>
                  <Typography>{_field.selected ? <CheckIcon fontSize="small" color="primary" /> : undefined} {question.title}</Typography>
                </Grid>
                {result != null
                  ? <Grid item>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography>
                        {
                          result.share != null && result.share !== 0 && !Number.isNaN(result.share)
                            ? ` (${parseFloat(`${result.share * 100}`).toFixed(2)}%)`
                            : ''
                        }
                        {result?.winner === true && !isOngoingPoll ? ` - ${t('status.winner')}` : ''}
                      </Typography>
                    </Stack>
                  </Grid> : undefined}
              </Grid>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2">{question.description}</Typography>
              <Grid container direction="row" justifyContent={uiIsSmall ? "space-between" : "flex-start"}
                alignItems="stretch" sx={{ pt: 2 }}>
                {items?.map((item, idx) => {
                  const key = `${_field.value}.${idx}`
                  return <Grid key={key} item container direction={uiIsSmall ? "row" : "column"} xs={uiIsSmall ? 5 : undefined}
                    justifyContent="space-around" alignItems="stretch" sx={personModifier}>
                    <Grid item justifyContent="center" alignItems="center" container xs={uiIsSmall ? 4 : undefined}>
                      <Avatar src={item.meta?.avatar.fullUrl} sx={avatarModifier} />
                    </Grid>
                    <Grid item justifyContent={uiIsSmall ? "flex-start" : "center"} alignItems="center" container
                      xs={uiIsSmall ? 8 : undefined}>
                      <Typography sx={fontModifier} textAlign={uiIsSmall ? "start" : "center"}>{item.title}</Typography>
                    </Grid>
                  </Grid>
                })}
              </Grid>
            </AccordionDetails>
          </Accordion>
        })}
      </>}
  </Grid>
}
