
export class ConnectionError extends Error {
  constructor (message?: string) {
    super(message ?? 'client.connection')
  }
}

export class DuplicationError extends Error {
  constructor (message?: string) {
    super(message ?? 'error.duplication')
  }
}

export const WEB_STATUS_OK = 200
export const WEB_STATUS_UNAUTHORIZED = 401
export const WEB_STATUS_NO_CONTENT = 204
