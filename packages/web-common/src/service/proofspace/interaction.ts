import { castPsFieldsFromSubject, type ProofspaceConfig, type ProofspaceIteractionConfig, type PsField } from '@smartapps-poll/common'
import { WebLinker, ENV } from 'ssi-auth-lib'
import type { ProofspaceInteraction } from './types'

export const buildInteraction = <T extends Record<string, unknown>>(config: ProofspaceConfig): ProofspaceInteraction<T> => {
  let interactionConfig: ProofspaceIteractionConfig | undefined
  const interactionCreds: Array<{ credentialId: string, attributes: PsField[] }> = []

  const _builder: ProofspaceInteraction<T> = {
    interaction: interaction => {
      interactionConfig = interaction
      return _builder
    },

    use: (config, tpl, subject) => {
      interactionCreds.push({
        credentialId: config.credentialId, attributes: castPsFieldsFromSubject(subject, tpl)
      })
      return _builder
    },

    run: async (outletId, size) => {
      if (interactionConfig == null) {
        throw new TypeError('Interaction config should be specified to build Proofspace interaction')
      }
      try {
        await WebLinker.start(
          document.getElementById(outletId) as HTMLDivElement,
          {
            env: config.dashboardBackendUrl.startsWith('https://stage.') ? ENV.STAGE : ENV.PROD, // How to override stage env for production like builds
            serviceDid: config.serviceId, // Insert your Service DID here
            interactionId: interactionConfig.interactionId, // Insert your interaction ID here
            instanceId: interactionConfig.instanceId, // Insert your instance ID here
            size: size ?? 250 // size of qr code in pixels
          },
          interactionCreds
        )
      } catch (e) {
        console.error(e)
        return false
      }

      return true
    }
  }

  return _builder
}
