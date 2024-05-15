import { type ProofspaceIteractionConfig } from './types'

export const castIteraction = (interaction: string): ProofspaceIteractionConfig => {
  const [interactionId, instanceId] = interaction.split('|')
  return { interactionId, instanceId }
}
