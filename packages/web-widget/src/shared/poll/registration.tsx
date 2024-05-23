import Button from '@mui/material/Button'
import CardActions from '@mui/material/CardActions'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import { type Poll, getRegistrationEndInterval, isProofRequired, getStartDateInterval, prepareViewQustions } from '@smartapps-poll/common'
import {
  ConditionInfo, ProgressButton, ProofspaceAuthChoiceAsync, AuthorizationChoice, ProofspaceIntegratedAuthAsync,
  ProofspaceIntegratedAuthorization, useTgAuthentication, useToggle, isViewWrapped
} from '@smartapps-poll/web-common'
import { useMemo, type FC } from 'react'
import { FormProvider, useFieldArray, useForm } from 'react-hook-form'
import { useCtx } from '../context'
import { Registration } from './consts'
import { type VoteForm } from './types'
import { useTranslation } from 'react-i18next'
import Grid from '@mui/material/Grid'
import CardHeader from '@mui/material/CardHeader'
import Card from '@mui/material/Card'
import days from 'dayjs'
import FormHelperText from '@mui/material/FormHelperText'
import Box from '@mui/material/Box'
import { PollQuestion } from './questions'
import { isCspCensus } from '../../helpers'
import { useSmallPaddings, useSmalllUI } from '../helpers'
import { Guide } from './guide'

export const PollViewRegistration: FC<PollViewRegistrationProps> = ({
  poll, status, onRegister, onRefresh
}) => {
  const { t } = useTranslation(undefined, { keyPrefix: 'shared.poll.register' })
  const context = useCtx()
  const toggle = useToggle(true)
  const auth = useToggle(false)

  const isWrapped = useMemo(() => isViewWrapped(context), [])
  const helper = useTgAuthentication()

  const methods = useForm<VoteForm>({ values: { ...poll, questions: prepareViewQustions(poll) } as unknown as VoteForm })
  const { control } = methods

  const register = async (): Promise<void> => {
    try {
      toggle.close()
      if (context.isAuthenticated() && !isProofRequired(poll)) {
        const result = await context.web.census.register(poll._id)
        if (result != null) {
          await onRegister()
        }
        auth.close()
      } else {
        auth.open()
      }
    } finally {
      toggle.open()
    }
  }

  const registerWithProof = async (): Promise<void> => {
    try {
      toggle.close()
      if (context.isAuthenticated()) {
        const result = await context.web.census.register(poll._id)
        if (result != null) {
          await onRegister()
        }
        auth.close()
      } else {
        auth.open()
      }
    } finally {
      toggle.open()
    }
  }

  const { fields: questions } = useFieldArray({ control, name: 'questions' })

  const endDate = new Date(poll.registrationEnd)
  const isInPast = days(endDate).isBefore(days())

  const paddingStyle = useSmallPaddings()

  const small = useSmalllUI()

  return <>
    {auth.opened
      ? <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {
          context.integration != null
            ? isProofRequired(poll)
              ? <ProofspaceIntegratedAuthorization pollId={poll._id} skipSuccess onBack={() => { }} onSuccess={registerWithProof} />
              : <ProofspaceIntegratedAuthAsync skipSuccess onSuccess={register} />
            : isProofRequired(poll)
              ? <AuthorizationChoice pollId={poll._id} skipSuccess onBack={() => { }} onSuccess={registerWithProof} />
              : <ProofspaceAuthChoiceAsync skipSuccess onSuccess={register} />
        }
      </CardContent>
      : <CardContent sx={{ ...paddingStyle, pt: 0 }}>
        <Grid container direction="row" justifyContent="space-between" alignItems="flex-start" columnSpacing={3}>
          <Grid item sm={8} xs={12} mb={1}>
            <FormProvider {...methods}>
              {!small ? <Typography variant="body1" gutterBottom mb={0}>{poll.description}</Typography> : undefined}
              <Box mb={0}>
                {helper.hasGolos || isWrapped ? undefined : <ConditionInfo poll={poll} noBorder />}
              </Box>
              {questions.map(
                (field, index) => <PollQuestion key={field.id} field={field} index={index} poll={poll} />
              )}
            </FormProvider>
          </Grid>
          <Grid item sm={4} xs={12}>
            {isCspCensus(poll)() ? <Card>
              <CardHeader title={t('stub.title')} titleTypographyProps={{ variant: 'body1', fontWeight: 'bold' }} />
              <CardContent>
                <Typography variant="body2" fontSize="small" gutterBottom mb={2}>
                  {t('stub.description')}
                </Typography>
                <Box>
                  <Typography variant="subtitle2" fontWeight="medium">{getStartDateInterval(poll).humanize()}</Typography>
                  <FormHelperText>{t('stub.startDate')}</FormHelperText>
                </Box>
              </CardContent>
              {onRefresh == null ? undefined : <CardActions sx={{ justifyContent: 'center', px: 2 }}>
                <ProgressButton fullWidth size="large" toggle={toggle} onClick={onRefresh}>
                  {t('stub.refresh')}
                </ProgressButton>
              </CardActions>}
            </Card> : <Card>
              <CardHeader title={t('actions.title')} titleTypographyProps={{ variant: 'body1', fontWeight: 'bold' }} />
              <CardContent>
                <Typography variant="body2" fontSize="small" gutterBottom mb={2}>
                  {t('actions.description')}
                </Typography>
                {isInPast
                  ? <Typography variant="subtitle2" fontWeight="medium">{t('actions.inPast')}</Typography>
                  : <Box>
                    <Typography variant="subtitle2" fontWeight="medium">{getRegistrationEndInterval(poll).humanize()}</Typography>
                    <FormHelperText>{t('actions.endDate')}</FormHelperText>
                  </Box>}
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', px: 2 }}>
                {
                  auth.opened ? undefined : status === Registration.REGISTERED
                    ? <Button disabled fullWidth>{t('status.registered')}</Button>
                    : <ProgressButton fullWidth size="large" toggle={toggle} onClick={register}>
                      {t('actions.register')}
                    </ProgressButton>
                }
              </CardActions>
            </Card>}
            <Guide poll={poll} noBorder />
          </Grid>
        </Grid>
      </CardContent>
    }
  </>
}

export interface PollViewRegistrationProps {
  poll: Poll
  status: Registration
  onRegister: () => Promise<void>
  onRefresh?: () => Promise<void>
}
