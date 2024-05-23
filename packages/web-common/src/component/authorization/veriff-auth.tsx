import { createVeriffFrame } from '@veriff/incontext-sdk'
import { useEffect } from 'react'
import { useCtx } from '../../context'
import { useTranslation } from 'react-i18next'
import { useInsist } from '../../client/insist'
import type { VeriffFinalDecision } from '@smartapps-poll/common'
import { VeriffAuthorizationCom } from './veriff/types'
import { shouldSkipGeo } from '../../client/fireproxy/geo-skip'
import { VeriffWarning } from './veriff/warning'
import { skipAdditionalVpnChecks } from '../../client'

export const VeriffAuthorization: VeriffAuthorizationCom = ({ pollId, handler, success, failure }) => {
  const ctx = useCtx()
  const { i18n } = useTranslation(undefined, { keyPrefix: 'common.authorization.veriff' })
  const destHandler: { handle?: () => void } = {}
  useEffect(() => destHandler.handle, [pollId])
  const insist = useInsist<VeriffFinalDecision>()

  handler.trigger = async () => {
    let _success: undefined | ((v: unknown) => void) = undefined
    let _failure: undefined | ((e?: Error) => void) = undefined
    const defer = new Promise((resolve, reject) => {
      _success = resolve
      _failure = reject
    })
    try {
      console.log(!await shouldSkipGeo(ctx), !skipAdditionalVpnChecks)
      if (!await shouldSkipGeo(ctx) && !skipAdditionalVpnChecks) {
        await failure(new Error('vpn'))
        return await ctx.modal.request(VeriffWarning)
      }
      const session = await ctx.web.veriff.init(pollId)
      const frame = createVeriffFrame({
        url: session.sessionUrl, lang: i18n.language != 'be' ? i18n.language : 'ru', onEvent: async event => {
          try {
            // console.log('veriff event', event)
            // @TODO check verification event and process respectively

            switch (event) {
              case 'CANCELED':
                failure(new Error())
                insist.stop()
                break
              case 'STARTED':
                break
              case 'FINISHED':
                insist.revive()
                const pickup = await ctx.web.authenticateAndPickUp<VeriffFinalDecision>(insist, session.token, {
                  uri: '/veriff/pickup'
                })
                if (!insist.stoped) {
                  if (pickup != null && pickup.pickup.status === 'ok') {
                    ctx.web.authToken = session.seed
                    void success()
                    // console.log('pick up', pickup)
                  } else {
                    throw new Error('veriff.pickup')
                  }
                }
                break
              default:
                throw new Error(`veriff.unknown.${event}`)
            }
            _success != null && _success(undefined)
          } catch (e) {
            void failure(e as Error)
            _failure != null && _failure(e as Error)
          }
        }
      })
      destHandler.handle = () => {
        insist.exit()
        frame.close()
      }
    } catch (e) {
      console.error(e)
    }
    await defer
  }

  return <></>
}

export default VeriffAuthorization
