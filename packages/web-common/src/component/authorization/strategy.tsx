import Stack from '@mui/material/Stack'
import { NEWBELARUS_STRATEGY, PROOFSPACE_STRATEGY, type Poll, PollError, type PollInfo, type ProofspaceConfig, type PsActionTemplate, isAuthroizationRequired } from '@smartapps-poll/common'
import { type FC } from 'react'
import { useCtx } from '../../context/model'
import Button from '@mui/material/Button'
import { useTranslation } from 'react-i18next'

/**
   * @throws Error
   */
export type VerifyPollForAuthorization = (poll: Poll | PollInfo, options: Object) => void

export const pollAuthroizationVerificators: Record<string, VerifyPollForAuthorization> = {
  [PROOFSPACE_STRATEGY]: (poll, options) => {
    const _options = options as ProofspaceConfig
    if (poll.requiredProofs == null) {
      throw new PollError('poll.noproof')
    }
    if (poll.requiredProofs.length < 1) {
      throw new PollError('poll.noproof')
    }
    const proof = poll.requiredProofs.find(proof => proof.type === PROOFSPACE_STRATEGY)
    const action: PsActionTemplate = proof?.meta as PsActionTemplate
    if (!isAuthroizationRequired(poll) && !action.credentialsRequired.includes(_options.keystoreCred.credentialId)) {
      throw new PollError('poll.proof.malformed')
    }
    if (action.credentialsRequired.length < 2) {
      throw new PollError('poll.proof.malformed')
    }
  },
  [NEWBELARUS_STRATEGY]: (poll) => {
    if (poll.requiredProofs == null) {
      throw new PollError('poll.noproof')
    }
    if (poll.requiredProofs.length < 1) {
      throw new PollError('poll.noproof')
    }
    const proof = poll.requiredProofs.find(proof => proof.type === NEWBELARUS_STRATEGY)
    if (proof?.meta == null) {
      throw new PollError('poll.proof.malformed')
    }
  }
}

export const ButtonStackStrategy: FC<ButtonStackStrategyProps> = ({ navigate, poll, strategy, authorize }) => {
  const ctx = useCtx()
  const { t } = useTranslation(undefined, { keyPrefix: 'common.authorization.choice' })

  switch (strategy) {
    case NEWBELARUS_STRATEGY:
      return <Stack direction="column" justifyContent="space-between" alignItems="center" spacing={1}>
        <Button variant="contained" size="large" fullWidth onClick={() => { void authorize() }}>{t('login')}</Button>
      </Stack>
    case PROOFSPACE_STRATEGY:
    default:
      return <Stack direction="column" justifyContent="space-between" alignItems="center" spacing={1}>
        <Button variant="contained" size="large" fullWidth onClick={() => { navigate('authenticate') }}>{t('login')}</Button>
        {ctx.isAuthenticated() || (poll != null && isAuthroizationRequired(poll))
          ? undefined
          : <Button variant="contained" size="large" fullWidth onClick={() => { navigate('register') }}>{t('register')}</Button>}
      </Stack>
  }
}

export interface ButtonStackStrategyProps {
  navigate: (view: string) => void
  poll: Poll | PollInfo
  strategy: string
  authorize: () => Promise<void>
}
