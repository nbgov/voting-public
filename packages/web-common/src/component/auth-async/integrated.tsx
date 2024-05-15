import { type FunctionComponent, useState } from 'react'
import { useCtx } from '../../context'
import { IntegrationError } from '../../integration'
import { ResultBox, ResultBoxStatus } from '../utils'
import { ProofspaceAuthChoiceAsync } from './choice'
import { useTranslation } from 'react-i18next'
import { LocalizedError } from '@smartapps-poll/common'

export const ProofspaceIntegratedAuthAsync: FunctionComponent<IntegratedAuthAsyncProps> = ({
  onSuccess, skipSuccess
}) => {
  const ctx = useCtx()
  const { t } = useTranslation(undefined, { keyPrefix: 'common.auth.integrated' })
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
    : <ProofspaceAuthChoiceAsync onSuccess={onChoiceSuccess} skipSuccess />
}

export interface IntegratedAuthAsyncProps {
  onSuccess: () => Promise<void>
  skipSuccess?: boolean
}
