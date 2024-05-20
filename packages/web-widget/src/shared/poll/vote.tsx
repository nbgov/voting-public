import CardActions from '@mui/material/CardActions'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import {
  LocalizedError, type Poll, type PollResult, VoteError, getEndDateInterval,
  isAuthroizationRequired, NEWBELARUS_STRATEGY, prepareViewQustions, WEBPASS_STRATEGY
} from '@smartapps-poll/common'
import {
  Backdrop, ProgressButton, ProofspaceAuthChoiceAsync, AuthorizationChoice,
  ProofspaceIntegratedAuthAsync, ProofspaceIntegratedAuthorization, ResultBox,
  ResultBoxStatus, useToggle, buildPollHelper, buildStoreHelper, useTgAuthentication,
  buildAnalytics, ConditionInfo, VeriffInitializationHandler, VeriffAuthorizationCom
} from '@smartapps-poll/web-common'
import { type FC, useEffect, useState, useMemo } from 'react'
import { FormProvider, useFieldArray, useForm } from 'react-hook-form'
import { useCtx } from '../context'
import { type VoteForm } from './types'
import Button from '@mui/material/Button'
import { useTranslation } from 'react-i18next'
import Grid from '@mui/material/Grid'
// import Paper from '@mui/material/Paper'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Box from '@mui/material/Box'
import FormHelperText from '@mui/material/FormHelperText'
import LinearProgress from '@mui/material/LinearProgress'
import days from 'dayjs'
import { PollViewVotedInfo } from './voted-info'
import { assertProofspaceErrorAboutPossibleDuplication, filterAnswers, isViewWrapped } from './utils'
import { useSmallPaddings, useSmallStyles } from '../helpers'
import { PollQuestion } from './questions'
import React from 'react'
const VeriffAuthorization: VeriffAuthorizationCom = React.lazy(() => import('@smartapps-poll/web-common/dist/component/authorization/veriff-auth') as any)

export const PollViewVote: FC<PollViewVoteProps> = ({ poll, onVote, onInfo, skipSuccess }) => {
  const { t } = useTranslation(undefined, { keyPrefix: 'shared.poll.vote' })
  const context = useCtx()
  const analytics = buildAnalytics(context)
  const pollHelper = useMemo(() => buildPollHelper(context), [])
  const veriffHandler = useMemo<VeriffInitializationHandler>(() => ({}), [])
  const toggle = useToggle(true)
  const auth = useToggle(false)
  const backdrop = useToggle(false)

  const [form, setForm] = useState<VoteForm>({ questions: [] })
  const [status, setStatus] = useState<ResultBoxStatus>(ResultBoxStatus.READY)
  const [error, setError] = useState<Error>(new LocalizedError('unknown'))
  const [results, setResults] = useState<PollResult | undefined>(undefined)
  const [voteId, setVoteId] = useState<string>('')

  const methods = useForm<VoteForm>({
    mode: 'all', defaultValues: { questions: prepareViewQustions(poll) }
  })

  const { control, handleSubmit, formState, watch, getValues } = methods

  const isWrapped = useMemo(() => isViewWrapped(context), [])

  const helper = useTgAuthentication()

  useEffect(() => {
    void (async () => {
      try {
        const info = await context.strategy.service().poll.info(poll)
        setResults(info)
      } catch (e) {
        console.error(e)
      }
    })()
  }, [poll._id])

  const vote = async (data: VoteForm): Promise<void> => {
    try {
      analytics.startVote(poll._id, context.strategy.service().getType(), 'vote')
      const state = await context.strategy.service().poll.check(poll)
      if (!state.valid || !state.exists) {
        throw new VoteError('vote.census.missed')
      }
      if (state.voted && !state.allowed) {
        throw new VoteError()
      }
      const votes = filterAnswers(data.questions)
      const [result, voteId] = await context.strategy.service().poll.vote(poll, votes)
      analytics.finishVote(poll._id, context.strategy.service().getType(), 'vote', result)
      if (result) {
        setStatus(ResultBoxStatus.SUCCESS)
        await buildStoreHelper(context).storeVote(poll, voteId, votes)
        setVoteId(voteId)
        if (skipSuccess != null) {
          await onVote(voteId)
        }
      }
    } catch (e) {
      console.error(e)
      throw new VoteError(e instanceof Error ? e.message : undefined)
    }
  }

  const tryVote = async (data: VoteForm): Promise<void> => {
    let strategy = 'unknown'
    try {
      toggle.close()
      if (isAuthroizationRequired(poll)) {
        backdrop.open()
        strategy = await pollHelper.getPollStrategy(poll)
        if (strategy === WEBPASS_STRATEGY) {
          analytics.startVote(poll._id, strategy, 'try')
          setForm(data)
          veriffHandler.trigger != null && void veriffHandler.trigger()
          return
        } else if (strategy === NEWBELARUS_STRATEGY) {
          analytics.startVote(poll._id, strategy, 'try')
          const challenged = await pollHelper.challenge(poll)
          if (challenged) {
            const votes = filterAnswers(data.questions)
            const [result, voteId] = await pollHelper.vote(poll, votes)
            analytics.finishVote(poll._id, strategy, 'try', result)
            if (result) {
              setStatus(ResultBoxStatus.SUCCESS)
              await buildStoreHelper(context).storeVote(poll, voteId, votes)
              setVoteId(voteId)
              if (skipSuccess != null) {
                await onVote(voteId)
              }
            } else {
              throw new VoteError('vote.proof.unauthorized')
            }
          } else {
            toggle.open()
          }
        } else {
          setForm(data)
          auth.open()
        }
        backdrop.close()
      } else if (context.isAuthenticated()) {
        backdrop.open()
        await vote(data)
        toggle.open()
        backdrop.close()
      } else {
        setForm(data)
        auth.open()
      }
    } catch (e) {
      analytics.finishVote(poll._id, strategy, 'try', false)
      console.error(e)
      setError(e as Error)
      setStatus(ResultBoxStatus.ERROR)
      backdrop.close()
      toggle.open()
    }
  }

  const afterAuth = async (): Promise<void> => {
    try {
      auth.close()
      backdrop.open()
      if (isAuthroizationRequired(poll)) {
        if (form.questions.length > 0) {
          await tryVoteWithProof(form)
        } else {
          const form = getValues()
          await tryVoteWithProof(form)
        }
      } else {
        await vote(form)
      }
    } catch (e) {
      setError(e as Error)
      setStatus(ResultBoxStatus.ERROR)
    } finally {
      toggle.open()
      backdrop.close()
    }
  }

  const onBack = async () => {
    auth.close()
    backdrop.close()
    toggle.open()
  }

  const tryVoteWithProof = async (data: VoteForm): Promise<void> => {
    try {
      const strategy = await pollHelper.getPollStrategy(poll)
      analytics.startVote(poll._id, strategy, 'tryWithProof')
      const votes = filterAnswers(data.questions)
      const [result, voteId] = await pollHelper.vote(poll, votes)
      analytics.finishVote(poll._id, strategy, 'tryWithProof', result)
      if (result) {
        setStatus(ResultBoxStatus.SUCCESS)
        await buildStoreHelper(context).storeVote(poll, voteId, votes)
        setVoteId(voteId)
        if (skipSuccess != null) {
          await onVote(voteId)
        }
      } else {
        throw new VoteError('vote.proof.unauthorized')
      }
    } catch (e) {
      console.error(e)
      if (e instanceof Error) {
        assertProofspaceErrorAboutPossibleDuplication(e)
      }
      throw new VoteError(e instanceof Error ? e.message : undefined)
    }
  }

  useEffect(() => {
    if (formState.errors.questions?.root?.message != null) {
      setError(new VoteError(formState.errors.questions?.root?.message))
      setStatus(ResultBoxStatus.ERROR)
    } else {
      setStatus(ResultBoxStatus.READY)
    }
  }, [formState.errors.questions?.root?.message])
  const paddingStyle = useSmallPaddings()

  const { fields: questions } = useFieldArray({ control, name: 'questions' })

  const ready = watch('questions').every(question => question.choices.some(choice => choice.selected))

  const endDate = new Date(poll.endDate)
  const isInPast = days(endDate).isBefore(days())

  const backDropStyles = useSmallStyles({ maxWidth: '50%' }, { maxWidth: '100%', mx: 2, px: 1 })

  return <>
    {auth.opened
      ? <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {
          context.integration != null
            ? isAuthroizationRequired(poll)
              ? <ProofspaceIntegratedAuthorization pollId={poll._id} skipSuccess onBack={onBack} onSuccess={afterAuth} />
              : <ProofspaceIntegratedAuthAsync skipSuccess onSuccess={afterAuth} />
            : isAuthroizationRequired(poll)
              ? <AuthorizationChoice pollId={poll._id} skipSuccess onBack={onBack} onSuccess={afterAuth}
                veriffHandler={veriffHandler} />
              : <ProofspaceAuthChoiceAsync skipSuccess onSuccess={afterAuth} />
        }
      </CardContent>
      : <CardContent sx={{ ...paddingStyle, pt: 0 }}>
        <Grid container direction="row" justifyContent="space-between" alignItems="flex-start" columnSpacing={3}>
          <Grid item sm={8} xs={12} mb={1}>
            <FormProvider {...methods}>
              <Typography variant={isWrapped ? "body2" : "body1"} gutterBottom mb={2}>{poll.description}</Typography>
              <Box mb={2}>
                {helper.hasGolos || isWrapped ? undefined : <ConditionInfo poll={poll} noBorder />}
              </Box>
              {/* <Paper sx={isWrapped ? { px: 0, border: 0 } : { px: 2 }}> */}
              <ResultBox status={status} error={error} onSuccess={async () => { await onVote(voteId) }} msg={{
                success: t('result.success'), error: t('result.error')
              }} />
              {questions.map(
                (field, index) => <PollQuestion key={field.id} field={field} index={index} poll={poll} />
              )}
              {/* </Paper> */}
            </FormProvider>
          </Grid>
          <Grid item sm={4} xs={12}>
            <Card sx={isWrapped ? { border: 0 } : {}}>
              {!isWrapped ? <CardHeader title={t('actions.title')}
                titleTypographyProps={{ variant: 'body1', fontWeight: 'bold' }} /> : undefined}
              {!isWrapped ? <CardContent>
                <Typography variant="body2" fontSize="small" gutterBottom mb={2}>
                  {t('actions.description')}
                </Typography>
                <PollViewVotedInfo results={results} poll={poll} />
                {isInPast
                  ? <Typography variant="subtitle2" fontWeight="medium">{t('actions.inPast')}</Typography>
                  : <Box>
                    <Typography variant="subtitle2" fontWeight="medium">{getEndDateInterval(poll).humanize()}</Typography>
                    <FormHelperText>{t('actions.endDate')}</FormHelperText>
                  </Box>}
              </CardContent> : undefined}
              {auth.opened
                ? undefined
                : <CardActions sx={{ justifyContent: 'center', flexDirection: 'column', px: 0 }}>
                  {!isWrapped ? <Button size="large" fullWidth onClick={() => { void onInfo() }}>{t('actions.check')}</Button> : undefined}
                  <ProgressButton size="large" fullWidth disabled={!ready} toggle={toggle} onClick={handleSubmit(tryVote)}>
                    {ready ? t('actions.vote') : t('actions.choose')}
                  </ProgressButton>
                </CardActions>}
            </Card>
          </Grid>
        </Grid>
      </CardContent>
    }
    <VeriffAuthorization pollId={poll?._id ?? ''} handler={veriffHandler} success={afterAuth} failure={onBack} />
    <Backdrop toggle={backdrop}>
      <Card sx={backDropStyles}>
        <CardHeader title={t('backdrop.title')} sx={{ pb: 1, mb: 0 }} />
        <CardContent sx={{ pt: 0, mt: 0 }}>
          <Typography variant="subtitle2">{t('backdrop.body')}</Typography>
          <LinearProgress />
        </CardContent>
      </Card>
    </Backdrop>
  </>
}

export interface PollViewVoteProps {
  poll: Poll
  onInfo: () => Promise<void>
  onVote: (id?: string) => Promise<void>
  skipSuccess?: boolean
}
