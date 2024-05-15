import { PsHookRequest, PsIssue, TgUser, castPsFieldsFromSubject, telegramPsType } from '@smartapps-poll/common'
import { Context } from '../../types'
import { buildSendToPsHandler } from '../../auth/method/proofspace/utils'

/**
 * @remote ✅
 */
export const issueTgCredForProofspace = async (ctx: Context, request: PsHookRequest, tgUser: TgUser) => {
  const response: PsIssue = {
    serviceDid: request.publicServiceDid,
    messageType: 'credentialIssued',
    subscriberConnectDid: request.subscriberConnectDid,
    credentials: [{
      credentialId: ctx.config.proofspace.telegramCred.credentialId,
      fields: castPsFieldsFromSubject({
        telegramId: tgUser.telegramId,
        nickname: tgUser.username == null || tgUser.username === '' ? '.unknown' : tgUser.username,
        name: tgUser.name == null || tgUser.name === '' ? 'Incognito' : tgUser.name,
        golos: `${tgUser.golos === undefined ? -1 : tgUser.golos ? 1 : 0}`,
        cyberVoter: `${tgUser.cyberVoter === undefined ? -1 : tgUser.cyberVoter ? 1 : 0}`,
        issuedAt: new Date().getTime().valueOf().toString()
      }, telegramPsType),
    }],
  }
  await buildSendToPsHandler(ctx).wait(response)
}
