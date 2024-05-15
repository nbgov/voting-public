import type { ProofspaceConfig } from '@smartapps-poll/common'
import type { RequestHandler } from 'express'

export const dispatchProofspaceConfig: RequestHandler = (req, res) => {
  const config: Partial<ProofspaceConfig> = {
    authCred: req.context.config.proofspace.authCred,
    dashboardBackendUrl: req.context.config.proofspace.dashboardBackendUrl,
    serviceId: req.context.config.proofspace.serviceId,
    regCred: req.context.config.proofspace.regCred,
    keystoreCred: req.context.config.proofspace.keystoreCred
  }
  res.json(config)
}
