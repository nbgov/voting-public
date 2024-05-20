import React from 'react'
import { type FC, useEffect, useState, useMemo } from 'react'
import { Navigator, Screen } from '../../app/navigator'
import { type ProofspaceAuthChoiceAsyncProps, ProofspaceRegisterationAsync } from '../auth-async'
import { useCtx } from '../../context/model'
import { useTranslation } from 'react-i18next'
import { useNavigation } from '../../app/navigation'
import { useToggle } from '../utils/toggle'
import { ResultBox, ResultBoxStatus } from '../utils/result-box'
import { DEFAULT_MEMBER_NAME, LocalizedError, MULTIPROOF_STRATEGY, PROOFSPACE_STRATEGY, WEBPASS_STRATEGY, isAuthroizationRequired } from '@smartapps-poll/common'
import type { PollInfo } from '@smartapps-poll/common'
import type { Account } from '@vocdoni/sdk'
import Box from '@mui/material/Box'
import { type SxProps } from '@mui/material/styles'
import Grid from '@mui/material/Grid'
import { PollLogo } from '../helper/logo'
import Typography from '@mui/material/Typography'
import { Backdrop } from '../utils/backdrop'
import { ProofspaceAuthorization } from './proofspace-auth'
import { HowToGetAuthorization } from './howto'
import { ButtonStackStrategy } from './strategy'
import { buildPollHelper, buildTelegramHelper } from '../../model'
import { ConditionInfo } from './info'
import { VeriffAuthorizationCom, VeriffInitializationHandler } from './veriff/types'

const VeriffAuthorization: VeriffAuthorizationCom = React.lazy(() => import('./veriff-auth') as any)

const contianerBoxStyle: SxProps = {
  backgroundRepeat: 'no-repeat',
  backgroundSize: 'auto 100%',
  backgroundPosition: '-50% center'
}

export const AuthorizationChoice: FC<AuthorizationChoiceProps> = ({
  pollId, onSuccess, onBack, skipSuccess, veriffHandler: _veriffHandler
}) => {
  const ctx = useCtx()
  const { t } = useTranslation(undefined, { keyPrefix: 'common.authorization.choice' })
  const nav = useNavigation({ defaultState: { screen: 'loading' } })
  const backdrop = useToggle(false)
  const pollHelper = useMemo(() => buildPollHelper(ctx), [])
  let veriffHandler = useMemo<VeriffInitializationHandler>(() => _veriffHandler ?? {}, [_veriffHandler])

  const [status, setStatus] = useState<ResultBoxStatus>(ResultBoxStatus.READY)
  const [error, setError] = useState<Error>(new LocalizedError('unknown'))
  const [account, setAccount] = useState<Account | undefined>()
  const [poll, setPoll] = useState<PollInfo | undefined>()
  const [strategy, setStrategy] = useState<string | undefined>()
  const [retries, setRetries] = useState(0)

  useEffect(() => {
    void (async () => {
      try {
        const poll = await ctx.web.polls.load(pollId)
        const strategy = await pollHelper.getPollStrategy(poll)

        setStrategy(strategy)
        setPoll(poll)

        /** 
         * @TODO Uncomment if it's possible to get telegram authentication token using pin-code 
         * It was temporary disabled cause the only way to get tg token right now is JWE
         **/
        // if (poll != null) {
        //   const tgHelper = buildTelegramHelper(ctx)
        //   await tgHelper.assertPollAuthorization(poll, true)
        // }
        if (poll != null) {
          const tgHelper = buildTelegramHelper(ctx)
          if (await tgHelper.mayBeUsedInstead(poll)) {
            setStatus(ResultBoxStatus.SUCCESS)
            return
          }
          if (!await tgHelper.assertPollBlocker(poll)) {
            onBack()
            return
          }
        }

        let screen = 'choice'
        if (strategy === MULTIPROOF_STRATEGY || strategy === WEBPASS_STRATEGY) {
          screen = 'choice'
        } else if (ctx.config.hideProofspace) {
          screen = 'info'
        } else if (pollId != null && strategy === PROOFSPACE_STRATEGY && !await pollHelper.isPsAuthenticationRequired(poll)) {
          screen = 'authenticate'
        }
        nav.go({ screen })
      } catch (e) {
        console.error(e)
        if (e instanceof Error) {
          setError(e)
        } else {
          setError(new LocalizedError('unknown'))
        }
        setStatus(ResultBoxStatus.ERROR)
      }
    })()
  }, [pollId, retries])

  useEffect(() => {
    if (skipSuccess != null && skipSuccess && status === ResultBoxStatus.SUCCESS) {
      void onSuccess(account?.name.default ?? DEFAULT_MEMBER_NAME)
    }
  }, [status])

  const retry = (): void => {
    setRetries(retries + 1)
    setStatus(ResultBoxStatus.READY)
  }

  const navigate = (view: string): void => {
    nav.go(view)
    setStatus(ResultBoxStatus.READY)
  }

  const onAuthSuccess = async (): Promise<void> => {
    backdrop.open()
    try {
      if (poll != null && isAuthroizationRequired(poll)) {
        setStatus(ResultBoxStatus.SUCCESS)
      } else {
        setAccount(await ctx.strategy.service().account.fetchEntity())
        if (ctx.isAuthenticated()) {
          setStatus(ResultBoxStatus.SUCCESS)
        } else {
          throw new Error('unknown')
        }
      }
    } catch (e) {
      setStatus(ResultBoxStatus.ERROR)
      setError(e as Error)
    }
    backdrop.close()
  }

  const onRegister = async (): Promise<void> => {
    backdrop.open()
    try {
      setAccount(await ctx.strategy.service().account.fetchEntity())
      if (ctx.isAuthenticated()) {
        navigate('howto')
      } else {
        throw new Error('unknown')
      }
    } catch (e) {
      setStatus(ResultBoxStatus.ERROR)
      setError(e as Error)
    }
    backdrop.close()
  }

  const proceed = async (): Promise<void> => {
    navigate('authenticate')
  }

  const onAuthFailure = async (e: Error): Promise<void> => {
    setStatus(ResultBoxStatus.ERROR)
    setError(e)
  }

  const onCancelRegistration = async (): Promise<void> => {
    setStatus(ResultBoxStatus.READY)
    navigate('authenticate')
  }

  const authorizeInstantly = async () => {
    backdrop.open()
    try {
      await pollHelper.challenge(poll)
      if (poll != null && isAuthroizationRequired(poll)) {
        setStatus(ResultBoxStatus.SUCCESS)
      } else {
        throw new Error('instant.authorization.missed')
      }
    } catch (e) {
      setStatus(ResultBoxStatus.ERROR)
      setError(e as Error)
    }
    backdrop.close()
  }

  const selectStrategy = async (strategy: string) => {
    try {
      if (strategy === WEBPASS_STRATEGY) {
        backdrop.open()
        veriffHandler.trigger != null && await veriffHandler.trigger()
        backdrop.close()
      } else if (strategy === PROOFSPACE_STRATEGY) {
        navigate('authenticate')
      }
    } catch (e) {
      setStatus(ResultBoxStatus.ERROR)
      setError(e as Error)
    }
  }

  return <Box sx={nav.current().screen === 'choice' ? contianerBoxStyle : {}}>
    <Navigator navigation={nav}>
      <ResultBox status={status} error={error} retry={retry} fullWidth onSuccess={
        async () => { await onSuccess(account?.name.default ?? DEFAULT_MEMBER_NAME) }
      } msg={{ success: t('result.success', { name: account?.name.default as string }), error: t('result.error') }}>
        <Screen screen="loading"></Screen>

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
              {strategy != null ? <ButtonStackStrategy strategy={strategy as string} navigate={navigate}
                poll={poll as PollInfo} authorize={authorizeInstantly} selectStrategy={selectStrategy} />
                : undefined}
            </Grid>
            <Grid item xs={2} minWidth={200}></Grid>
          </Grid>
        </Screen>

        <Screen screen="authenticate">
          <Grid container minWidth={250} p={1} direction="column" justifyContent="center" alignItems="stretch">
            {poll == null ? undefined
              : <ProofspaceAuthorization poll={poll!} onSuccess={onAuthSuccess} onFailure={onAuthFailure} />}
          </Grid>
        </Screen>
        <Screen screen="info">
          <ConditionInfo poll={poll} back={onBack} />
        </Screen>
        <Screen screen="register">
          <ProofspaceRegisterationAsync onCancel={onCancelRegistration} onCreate={onRegister} onFailure={onAuthFailure} />
        </Screen>
        <Screen screen="howto">
          {poll == null ? undefined : <HowToGetAuthorization poll={poll} next={proceed} />}
        </Screen>

      </ResultBox>
      {_veriffHandler != null
        ? <VeriffAuthorization pollId={poll?._id ?? ''} handler={veriffHandler}
          success={onAuthSuccess} failure={onAuthFailure} />
        : undefined}
      <Backdrop toggle={backdrop} />
    </Navigator>
  </Box>
}

export interface AuthorizationChoiceProps extends ProofspaceAuthChoiceAsyncProps {
  onBack: () => void
  pollId: string
  veriffHandler?: VeriffInitializationHandler
}
