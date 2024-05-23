import CardActions from '@mui/material/CardActions'
import CardContent from '@mui/material/CardContent'
import { prepareViewQustions, type ChoiceResult, type Poll, type PollRegistrationInfo, type PollResult, type VoteInfo } from '@smartapps-poll/common'
import {
  type IQuestion, ProgressButton, ProofspaceAuthChoiceAsync, ProofspaceIntegratedAuthAsync, buildAnalytics,
  useToggle, buildStoreHelper, isViewWrapped
} from '@smartapps-poll/web-common'
import { useCtx } from '../context'
import { type FunctionComponent, useEffect, useState, useMemo } from 'react'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import { type VoteIdForm } from './types'
import { PollViewCensusInfo } from './census-info'
import { useTranslation } from 'react-i18next'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import { PollViewVotedInfo } from './voted-info'
import TextField from '@mui/material/TextField'
import { isCspCensus } from '../../helpers'
import { useSmallPaddings, useSmallStyles, useSmalllUI } from '../helpers'
import { PollQuestion } from './questions'

export const PollViewResults: FunctionComponent<PollViewResultsProps> = ({ poll, voteId }) => {
  const { t } = useTranslation(undefined, { keyPrefix: 'shared.poll.result' })
  const context = useCtx()
  const analytics = buildAnalytics(context)
  const auth = useToggle(false)
  const toggle = useToggle(true)

  useEffect(() => { void check() }, [poll._id])

  const isWrapped = useMemo(() => isViewWrapped(context), [])

  const methods = useForm<VoteIdForm>({
    defaultValues: { voteId },
    mode: 'all'
  })

  const { control: voteControl, getValues, handleSubmit } = methods

  const [regInfo, setRegInfo] = useState<PollRegistrationInfo | undefined>(undefined)
  const [voteInfo, setVoteInfo] = useState<VoteInfo | undefined>(undefined)
  const [results, setResults] = useState<PollResult | undefined>(undefined)

  const questions = useMemo(() => prepareViewQustions(poll) as IQuestion[], [poll._id])
  const paddingStyle = useSmallPaddings()
  const uiIsSmall = useSmalllUI()

  const afterAuth = async (): Promise<void> => {
    try {
      await check()
    } catch (e) {
      console.error(e)
    } finally {
      auth.close()
      toggle.open()
    }
  }

  const check = async (): Promise<void> => {
    voteId = voteId ?? getValues('voteId')
    try {
      analytics.log('check_vote', { poll: poll._id })
      const info = await context.strategy.service().poll.info(poll)
      console.info(info)
      setResults(info)
    } catch (e) {
      console.error(e)
    }
    try {
      const check = await context.strategy.service().poll.check(poll)
      console.info(check)
      setRegInfo(check)
    } catch (e) {
      console.error(e)
    }
    try {
      const vote = await context.strategy.service().poll.read(poll, voteId)
      if ((vote?.result == null || vote.result.length === 0) && voteId != null) {
        const votes = await buildStoreHelper(context).loadVotes(voteId)
        // @TODO This hack (flatMap) is working well for one varient questions. In other cases it may induce a bug
        vote.result = votes?.flatMap(
          vote => vote?.choices?.filter(choice => (choice as any).selected)
            .map(choice => choice.value) ?? []
        ) ?? []
      }
      console.info(vote)
      setVoteInfo(vote)
    } catch (e) {
      console.error(e)
    }
  }

  const tryCheck = async (): Promise<void> => {
    try {
      toggle.close()
      if (context.isAuthenticated()) {
        await check()
      } else {
        auth.open()
      }
    } catch (e) {
      console.error(e)
    } finally {
      toggle.open()
    }
  }

  const smallVoteIdResult = useSmallStyles({}, { display: { xs: 'none' } })
  const small = useSmalllUI()

  return <>
    {auth.opened
      ? <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {
          (context.integration != null)
            ? <ProofspaceIntegratedAuthAsync skipSuccess onSuccess={afterAuth} />
            : <ProofspaceAuthChoiceAsync skipSuccess onSuccess={afterAuth} />
        }
      </CardContent>
      : <CardContent sx={paddingStyle}>
        <Grid container direction="row" justifyContent="space-between" alignItems="flex-start" columnSpacing={3}>
          {isCspCensus(poll)()
            ? <Grid item sm={8} xs={12} mb={1}>
              {voteId != null ? <Typography variant="caption" sx={smallVoteIdResult}>{t('voted', { voteId })}</Typography> : undefined}
              <Controller control={voteControl} name="voteId" render={
                ({ field, fieldState }) =>
                  <TextField onChange={field.onChange} fullWidth sx={{ mt: 2 }} value={field.value}
                    label={t('voteForm.voteId.label')} error={fieldState.invalid}
                    helperText={t(
                      fieldState.error?.message ?? voteId == null ? 'voteForm.voteId.hint' : 'voteForm.voteId.provided'
                    )} />
              } rules={{ required: 'voteForm.error.required' }} />
            </Grid>
            : undefined}
          <Grid item sm={8} xs={12} mb={1}>
            {!small ? <Typography variant={isWrapped ? "body2" : "body1"} gutterBottom mb={2}>{poll.description}</Typography> : undefined}
            <FormProvider {...methods}>
              {context.isAuthenticated() && regInfo != null
                ? <PollViewCensusInfo status={regInfo} />
                : undefined}
              {(results?.questions ?? questions).map((field, index) => {
                const id = (field as any).id ?? `${index}`
                const choices: ChoiceResult[] | undefined = voteInfo != null
                  ? field.choices.map((choice, idx) => ({
                    ...choice, selected: voteInfo.result[index] === idx
                  }) as unknown as ChoiceResult)
                  : undefined

                return <PollQuestion key={id} field={{ ...field, choices: choices ?? field.choices, id }}
                  index={index} poll={poll} />
              })}
            </FormProvider>
          </Grid>
          {uiIsSmall ? undefined : <Grid item sm={4} xs={12}>
            <Card>
              <CardHeader title={t('actions.title')}
                titleTypographyProps={{ variant: 'body1', fontWeight: 'bold' }} />
              <CardContent>
                <Typography variant="body2" fontSize="small" gutterBottom mb={2}>
                  {t('actions.description')}
                </Typography>
                <PollViewVotedInfo results={results} poll={poll} />
              </CardContent>
              {auth.opened
                ? undefined
                : <CardActions sx={{ justifyContent: 'center', flexDirection: 'column', ...paddingStyle }}>
                  <ProgressButton size="large" fullWidth toggle={toggle}
                    onClick={isCspCensus(poll)() ? handleSubmit(check) : tryCheck}>
                    {regInfo != null ? t('actions.recheck') : t('actions.check')}
                  </ProgressButton>
                </CardActions>}
            </Card>
          </Grid>}
        </Grid>
      </CardContent>}
  </>
}

export interface PollViewResultsProps {
  poll: Poll
  voteId?: string
}
