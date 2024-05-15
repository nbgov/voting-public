import { Poll } from '../poll'
import { PROOFSPACE_STRATEGY } from '../proofspace/consts'
import { type Pager, type Pagination } from './types'

export const fillPagination = (pager?: Pager): Pagination => {
  if (pager != null) {
    pager = Object.fromEntries(Object.entries(pager).map(([key, value]) => {
      return [key, typeof value === 'string' ? parseInt(value) : value]
    }))
  }
  return { page: pager?.page ?? 0, size: pager?.size == null ? 20 : pager.size > 50 ? 50 : pager.size < 1 ? 1 : pager.size }
}

export const filterPollWithStrategy = (strategy: string) => (poll: Poll) =>
  (strategy === PROOFSPACE_STRATEGY && poll.requiredProofs == null)
    || poll.requiredProofs?.some(proof => proof.type === strategy)
