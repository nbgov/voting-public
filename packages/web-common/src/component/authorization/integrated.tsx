import { type FunctionComponent, useState } from 'react'
import { type IntegratedAuthAsyncProps } from '../auth-async/integrated'
import { useCtx } from '../../context'
import { useTranslation } from 'react-i18next'
import { ResultBox, ResultBoxStatus } from '../utils'
import { LocalizedError } from '@smartapps-poll/common'
import { IntegrationError } from '../../integration'
import { AuthorizationChoice } from './choice'

export const ProofspaceIntegratedAuthorization: FunctionComponent<ProofspaceIntegratedAuthorizationProsp> = ({
  pollId, onSuccess, onBack, skipSuccess
}) => {
  const ctx = useCtx()
  const { t } = useTranslation(undefined, { keyPrefix: 'common.authorization.integrated' })
  const [success, setSuccess] = useState(false)
  const [status, setStatus] = useState<ResultBoxStatus>(ResultBoxStatus.READY)
  const [error, setError] = useState<Error | undefined>(new LocalizedError('unknown'))
  const [name, setName] = useState<string>('')
  const onChoiceSuccess = async (name: string): Promise<void> => {
    setSuccess(true)
    try {
      setName(name)
      if (ctx.integration != null) {
        const member = await ctx.web.integration.authenticate(ctx.integration.params, name)
        if (member == null) {
          throw new IntegrationError('integration.auth.failed')
        }
        setStatus(ResultBoxStatus.SUCCESS)
        if (skipSuccess != null && skipSuccess) {
          void onSuccess()
        }
      } else {
        throw new IntegrationError('integration.configured')
      }
    } catch (e) {
      ctx.web.unauthenticate()
      setStatus(ResultBoxStatus.ERROR)
      setError(e as Error)
    }
  }

  const retry = (): void => {
    setSuccess(false)
    setStatus(ResultBoxStatus.READY)
  }

  return success
    ? <ResultBox status={status} error={error} retry={retry} msg={{
      success: t('result.success', { name }), error: t('result.error')
    }} onSuccess={onSuccess} />
    : <AuthorizationChoice pollId={pollId} onBack={onBack} onSuccess={onChoiceSuccess} skipSuccess />
}

export interface ProofspaceIntegratedAuthorizationProsp extends IntegratedAuthAsyncProps {
  onBack: () => void
  pollId: string
}
