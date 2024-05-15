import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { type ReactElement, type FunctionComponent, type PropsWithChildren, useRef, useEffect } from 'react'
import { ConnectionError } from '../../client/errors'
import { IntegrationError, IntegrationUnauthorizedError } from '../../integration/errors'
import { AuthenticationError, CredentialsWalletError } from '../auth/errors'
import { PollError } from './errors'
import { LocalizedError, VoteError } from '@smartapps-poll/common'
import { useTranslation } from 'react-i18next'

export const ResultBox: FunctionComponent<PropsWithChildren<ResultBoxProps>> = ({
  status, error, onSuccess, retry, msg, fullWidth, maxWidth, children
}) => {
  const { t } = useTranslation()
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: 'smooth' })
  }, [status, error])

  const body = (): ReactElement => status === ResultBoxStatus.SUCCESS
    ? <Grid item xs={12}>
      <Card sx={{ minWidth: 250 }}>
        <CardContent>
          <Alert title={`${t('common.resultbox.title.success')}`} severity="success" ref={ref}>
            <Typography variant="h6">{msg.success}</Typography>
          </Alert>
          <Button fullWidth variant="outlined" size="large" onClick={() => { void onSuccess() }}>
            {t('common.resultbox.button.continue')}
          </Button>
        </CardContent>
      </Card>
    </Grid>
    : status === ResultBoxStatus.ERROR
      ? <Grid item xs={12}>
        <Card sx={{ minWidth: 250, maxWidth: window.innerWidth * 0.9 }}>
          <CardContent>
            <Alert title={`${t('common.resultbox.title.error')}`} severity="error" {...(retry != null
              ? {
                action: <Button onClick={retry} variant="outlined">
                  {t('common.resultbox.button.retry')}
                </Button>
              }
              : {})} ref={ref}>
              <Typography variant="h6">{t('common.resultbox.error.subtitle')}</Typography>
              {error instanceof VoteError
                ? <Typography variant="body1">{t('common.resultbox.error.vote')}</Typography>
                : error instanceof PollError
                  ? <Typography variant="body1">{t('common.resultbox.error.poll')}</Typography>
                  : error instanceof ConnectionError
                    ? <Typography variant="body1">{t('common.resultbox.error.connection')}</Typography>
                    : error instanceof CredentialsWalletError
                      ? <Typography variant="body1">{t('common.resultbox.error.credWallet')}</Typography>
                      : error instanceof AuthenticationError
                        ? <Typography variant="body1">{t('common.resultbox.error.authentication')}</Typography>
                        : error instanceof IntegrationUnauthorizedError
                          ? <Typography variant="body1">{t('common.resultbox.error.integrationUnauthorized')}</Typography>
                          : error instanceof IntegrationError
                            ? <Typography variant="body1">{t('common.resultbox.error.integration')}</Typography>
                            : <Typography variant="body1">{msg.error}</Typography>
              }
              <Typography variant="body1">{
                t('common.resultbox.error.message', {
                  message: error == null
                    ? t('common.resultbox.error.default')
                    : error instanceof LocalizedError
                      ? error.toString()
                      : error instanceof Error && error.message != null
                        ? `${t(error.message)}` : error.toString()
                })
                // `Message: ${error == null ? 'Ups! We don\'t know what has happened!' : error.message}`
              }</Typography>
            </Alert>
          </CardContent>
        </Card>
      </Grid>
      : <>{children}</>

  return children != null
    ? <Grid container wrap="wrap" maxWidth={fullWidth === true ? undefined : maxWidth ?? 700} direction="row" justifyContent="center" alignItems="stretch">
      {body()}
    </Grid>
    : body()
}

export interface ResultBoxProps {
  fullWidth?: boolean
  maxWidth?: number
  msg: {
    success: string
    error: string
  }
  error?: Error | string | null
  retry?: () => void
  status: ResultBoxStatus
  onSuccess: () => Promise<void>
}

export enum ResultBoxStatus {
  SUCCESS = 1,
  ERROR = 2,
  READY = 3
}
