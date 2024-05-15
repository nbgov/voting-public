import { type W3CUtils } from './types'
import { buildW3cPresentationRequestBuilder } from './vp/utils'

export const w3cUtils: W3CUtils = {
  presentation: {
    request: {
      builder: buildW3cPresentationRequestBuilder
    }
  }
}
