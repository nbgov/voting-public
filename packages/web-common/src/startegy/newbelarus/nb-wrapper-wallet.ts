import { type CredentialsWalletStrategy, NEWBELARUS_STRATEGY, type DockActionTemplate, type DockActionRequest, dockNBPrefedinedActions, dockActionRequestToW3C, type RequiredProof } from '@smartapps-poll/common'
import { type WebStrategy } from '../types'
import { type CommonContext } from '../../context'
import { ConnectionError, DuplicationError, WEB_STATUS_OK } from '../../client/errors'
import { PresentationCreationStatus, buildPresentationManager } from '@smartapps-poll/dock-wrapper-sdk'
import { NewBelarusWalletInteractionError, NewBelarusWalletNotFound } from './errors'
import { DUPLICATION_ERROR_CODE } from './consts'
import { AuthenticationError } from '../../component/auth/errors'

export const createNBWrapperWalletStrategy = (): CredentialsWalletStrategy<CommonContext> => {
  let strategy: WebStrategy
  const _strategy: CredentialsWalletStrategy<CommonContext> = {
    setStrategyContext: _strategy => { strategy = _strategy },

    /**
     * @TODO Make sure it's a proper way. There is actually no need in long-living authentication
     */
    isAuthenticated: () => strategy.ctx().web.authToken != null,

    getRequiredProofList: async _ => {
      return dockNBPrefedinedActions
    },

    castProofInfo: action => {
      action = Array.isArray(action)
        ? action.find(action => action.type === NEWBELARUS_STRATEGY) as RequiredProof
        : action
      const _action = action as unknown as DockActionTemplate
      if (_action?.type !== NEWBELARUS_STRATEGY) {
        throw new NewBelarusWalletInteractionError('wallet.action.mismatch')
      }

      return {
        type: _action.type,
        refId: _action.refId,
        guideUrl: _action.guideUrl,
        title: _action.title
      }
    },

    challenge: async poll => {
      const web = strategy.ctx().web.client()
      const points = strategy.ctx().endpoints.verification.newbelarus

      const request = await web.get<DockActionRequest[]>(`${points.startPrefix}${poll._id}${points.startSuffix}`)
      if (request.status !== WEB_STATUS_OK) {
        throw new ConnectionError()
      }

      const presManager = buildPresentationManager()
      const domainSource = strategy.ctx().web.currentUrl()
      const presData = await presManager.create(dockActionRequestToW3C(
        request.data,
        request.data.reduce((reasons, cred) => ({
          ...reasons, ...(Object.fromEntries(cred.credentialsRequired.map(
            type => [type, strategy.ctx().i18n?.t(`reason.${type}`, { ns: NEWBELARUS_STRATEGY })]
          )))
        }), {}),
        domainSource.host
      ))
      presManager.dispose()
      if (presData == null) {
        throw new NewBelarusWalletInteractionError()
      }

      switch (presData.status) {
        case PresentationCreationStatus.CANCELED:
          return false
        case PresentationCreationStatus.NOTFOUND:
          throw new NewBelarusWalletNotFound()
        case PresentationCreationStatus.SUCCEEDED:
          break
        case PresentationCreationStatus.ERROR:
          throw presData.error
        default:
          throw new NewBelarusWalletInteractionError()
      }

      strategy.ctx().web.authenticated(request.data[0].challenge)
      const verifyResult = await web.post(`${points.verifyPrefix}${poll._id}${points.verifySuffix}`, presData.result)
      if (verifyResult.status !== WEB_STATUS_OK) {
        strategy.ctx().web.unauthenticate()
        if (verifyResult.data != null && verifyResult.data.message === DUPLICATION_ERROR_CODE) {
          throw new DuplicationError()
        } else if (verifyResult.status === 417) {
          throw new AuthenticationError(`error.${verifyResult.data.message}`)
        } else {
          throw new ConnectionError()
        }
      }

      return true
    },

    getType: () => NEWBELARUS_STRATEGY
  }

  return _strategy
}
