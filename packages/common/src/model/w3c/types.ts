import { type PresentationRequestQueryNewBelarusItem, type PresentationRequestQueryExampleItem, type PresentationRequestQueryFrameItem, type PresentationRequestQueryType } from './vp/request'
import { type W3CPresentationRequestBuilder } from './vp/types'

export interface W3CUtils {
  presentation: {
    request: {
      builder: W3CUtilsPresentationRequestBulder
    }
  }
}

export type W3CUtilsPresentationRequestBulder = (
  challenge: string,
  type?: PresentationRequestQueryType
) => W3CPresentationRequestBuilder<
  typeof type extends PresentationRequestQueryType.Frame ? PresentationRequestQueryFrameItem :
  typeof type extends PresentationRequestQueryType.Example ? PresentationRequestQueryExampleItem :
  typeof type extends PresentationRequestQueryType.SimpleZK ? PresentationRequestQueryNewBelarusItem
  : PresentationRequestQueryNewBelarusItem
>
