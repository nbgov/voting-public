import { constants as HTTP } from 'http2'
import type { Response } from 'express'
import { IntegrationError, ProofspaceError } from '../model/errors'
import { AxiosError } from 'axios'
import { MalformedError } from './errors'

export const processHttpError = (e: unknown, res: Response) => {
  console.error(e)
  if (e instanceof MalformedError) {
    res.status(HTTP.HTTP_STATUS_BAD_REQUEST)
  } else if (e instanceof IntegrationError) {
    if (e.message === 'integration.notauthorized') {
      res.status(HTTP.HTTP_STATUS_UNAUTHORIZED)
    } else {
      res.status(HTTP.HTTP_STATUS_BAD_REQUEST)
    }
  } else if (e instanceof AxiosError) {
    res.status(e.status ?? HTTP.HTTP_STATUS_FAILED_DEPENDENCY)
  } else if (e instanceof ProofspaceError) {
    res.status(HTTP.HTTP_STATUS_FAILED_DEPENDENCY)
  } else {
    res.status(HTTP.HTTP_STATUS_FORBIDDEN)
  }
  res.send(e instanceof Error ? { error: e.message } : undefined)
}
