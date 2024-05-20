
export interface VeriffInitResponse {
  seed: string
  token: string
  sessionUrl: string
}

export interface VeriffInitParams {
  pollId: string
}

export interface VeriffFinalDecision {
  status: string
}

export interface VeriffProofMeta extends Record<string, unknown> {
}
