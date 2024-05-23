import type { CommonContext } from '../context/types'

export const isViewWrapped = (ctx: CommonContext): boolean => {
  const url = ctx.web.currentUrl()
  /**
   * @TODO It's a little bit dirty hack. We need to check exact startegy here
   */
  if ("_credsStrategy" in url.query) {
    return true
  }
  return false
}
