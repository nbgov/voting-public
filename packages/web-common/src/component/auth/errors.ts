export class CredentialsWalletError extends Error {
  constructor (message?: string) {
    super(message ?? 'proofpsace.error')
  }
}

export class AuthenticationError extends Error {
  constructor (message?: string) {
    super(message ?? 'authentication.failed')
  }
}
