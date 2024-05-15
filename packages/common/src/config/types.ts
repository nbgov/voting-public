
export interface ProofspaceConfig {
  dashboardBackendUrl: string
  serviceId: string
  pubKeyId: string
  telegramCred: ProofspaceCredConfig
  keystoreCred: ProofspaceCredConfig
  authCred: ProofspaceCredConfig
  regCred: ProofspaceCredConfig
  passportCred: ProofspacePassportConfig
  pk?: string
}

export interface ProofspaceCredConfig {
  credentialId: string
  schemaId: string
  interaction?: string
}

export interface ProofspaceIteractionConfig {
  interactionId: string
  instanceId: string
}

export interface ProofspacePassportConfig extends CredentialConfig {
  credentialId: string
  schemaId: string
  birthdateMultiplier: number
}

export interface NewBelarusConfig extends CredentialConfig {
}

export interface CredentialConfig {
  keyField: string
}
