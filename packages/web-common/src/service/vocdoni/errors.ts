
export class CryptoError extends Error {
  constructor(message?: string) {
    super(message ?? 'crypto.not.initialized')
  }
}
