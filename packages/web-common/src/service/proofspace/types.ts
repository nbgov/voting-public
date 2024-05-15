import type { ProofspaceCredConfig, ProofspaceIteractionConfig } from '@smartapps-poll/common'

export interface ProofspaceInteraction<T> {
  interaction: (interaction: ProofspaceIteractionConfig) => ProofspaceInteraction<T>
  use: (config: ProofspaceCredConfig, tpl: Record<string, string>, subject: T) => ProofspaceInteraction<T>
  run: (outletId: string, size?: number) => Promise<boolean>
}
