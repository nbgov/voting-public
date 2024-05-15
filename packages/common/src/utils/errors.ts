
export class LocalizedError extends Error {
  messageParams?: Record<string, string>

  messageKey: string

  static translator?: (key: string, params?: Record<string, string>) => string

  constructor (key: string, params?: Record<string, string>) {
    super(key)
    this.messageKey = key
    this.messageParams = params
  }

  toString (): string {
    if (LocalizedError.translator != null) {
      return LocalizedError.translator(this.messageKey, this.messageParams)
    }

    return super.toString()
  }
}
