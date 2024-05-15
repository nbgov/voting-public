import { type FunctionComponent, useState, useEffect } from 'react'
import { Navigator, Screen } from '../../app/navigator'
import { ProofspaceAuthenticationAsync } from './auth'
import { ProofspaceRegisterationAsync } from './registeration'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import { useNavigation } from '../../app/navigation'
import { useCtx } from '../../context'
import type { Account } from '@vocdoni/sdk'
import { Backdrop, useToggle } from '../utils'
import { DEFAULT_MEMBER_NAME, LocalizedError } from '@smartapps-poll/common'
import { ResultBox, ResultBoxStatus as Status } from '../utils/result-box'
import Box from '@mui/material/Box'
import type { SxProps } from '@mui/system/styleFunctionSx/styleFunctionSx'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import Stack from '@mui/material/Stack'
import { PollLogo } from '../helper/logo'

const contianerBoxStyle: SxProps = {
  backgroundRepeat: 'no-repeat',
  backgroundSize: 'auto 100%',
  backgroundPosition: '-50% center'
}

export const ProofspaceAuthChoiceAsync: FunctionComponent<ProofspaceAuthChoiceAsyncProps> = ({ onSuccess, skipSuccess }) => {
  const ctx = useCtx()
  const { t } = useTranslation(undefined, { keyPrefix: 'common.auth.choice' })
  const nav = useNavigation({ defaultState: { screen: 'choice' } })
  const backdrop = useToggle(false)

  const [status, setStatus] = useState<Status>(() => ctx.isAuthenticated() ? Status.SUCCESS : Status.READY)
  const [error, setError] = useState<Error>(new LocalizedError('unknown'))
  const [account, setAccount] = useState<Account | undefined>()

  useEffect(() => {
    if (skipSuccess != null && skipSuccess && status === Status.SUCCESS) {
      void onSuccess(account?.name.default ?? DEFAULT_MEMBER_NAME)
    }
  }, [status])

  const retry = (): void => {
    setStatus(Status.READY)
  }

  const navigate = (view: string): void => {
    nav.go(view)
    setStatus(Status.READY)
  }

  const onAuthSuccess = async (): Promise<void> => {
    backdrop.open()
    try {
      let account: Account | undefined
      // @TODO Remove when the blockchain is stable and isn't wiped every week BEGINS
      try {
        account = await ctx.strategy.service().account.fetchEntity()
      } catch (e) {
        const err = e as Error
        if (err.message.startsWith('account not found:')) {
          await ctx.strategy.service().account.create(DEFAULT_MEMBER_NAME)
          account = await ctx.strategy.service().account.fetchEntity()
        } else {
          throw e
        }
      }
      // @TODO Remove when the blockchain is stable and isn't wiped every week ENDS
      setAccount(account)
      if (ctx.isAuthenticated()) {
        setStatus(Status.SUCCESS)
      } else {
        throw new Error('unknown')
      }
    } catch (e) {
      setStatus(Status.ERROR)
      setError(e as Error)
    }
    backdrop.close()
  }

  const onAuthFailure = async (e: Error): Promise<void> => {
    setStatus(Status.ERROR)
    setError(e)
  }

  const onCancelRegistration = async (): Promise<void> => {
    setStatus(Status.READY)
    navigate('authenticate')
  }

  return <Box sx={nav.current().screen === 'choice' ? contianerBoxStyle : {}}>
    <Navigator navigation={nav}>
      <ResultBox status={status} error={error} retry={retry} fullWidth onSuccess={
        async () => { await onSuccess(account?.name.default ?? DEFAULT_MEMBER_NAME) }
      } msg={{
        success: t('result.success', { name: account?.name.default as string }),
        error: t('result.error')
      }}>
        <Screen screen="choice">
          <Grid item container xs={12} minWidth={250} minHeight={600} p={1} direction="column" justifyContent="center" alignItems="center">
            <Grid item container xs={3} direction="column" justifyContent="center" alignContent="center">
              <PollLogo />
            </Grid>
            <Grid item xs={6}>
              <Typography variant="h2" gutterBottom textAlign="center">{t('title')}</Typography>
              <Typography variant="body1" color="light" gutterBottom textAlign="center">{t('subtitle')}</Typography>
            </Grid>
            <Grid item xs={1} minWidth={200}>
              <Stack direction="column" justifyContent="space-between" alignItems="center" spacing={1}>
                <Button variant="contained" size="large" fullWidth onClick={() => { navigate('authenticate') }}>{t('login')}</Button>
                <Button variant="contained" size="large" fullWidth onClick={() => { navigate('register') }}>{t('register')}</Button>
              </Stack>
            </Grid>
            <Grid item xs={2} minWidth={200}></Grid>
          </Grid>
        </Screen>

        <Screen screen="authenticate">
          <Grid item container xs={12} minWidth={250} minHeight={600} p={1} direction="column" justifyContent="center" alignItems="stretch">
            <ProofspaceAuthenticationAsync onSuccess={onAuthSuccess} onFailure={onAuthFailure} />
          </Grid>
        </Screen>
        <Screen screen="register">
          <ProofspaceRegisterationAsync onCancel={onCancelRegistration} onCreate={onAuthSuccess} onFailure={onAuthFailure} />
        </Screen>

      </ResultBox>
      <Backdrop toggle={backdrop} />
    </Navigator>
  </Box>
}

export interface ProofspaceAuthChoiceAsyncProps {
  onSuccess: (name: string) => Promise<void>
  skipSuccess?: boolean
}
