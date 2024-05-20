import { createHmac } from 'node:crypto'

export const signVeriffPayload = (secret: string, data: string): string =>
  createHmac('sha256', secret).update(data).digest('hex')
