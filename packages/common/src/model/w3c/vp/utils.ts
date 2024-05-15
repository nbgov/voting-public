import { type W3CUtilsPresentationRequestBulder } from '../types'
import { type PresentationRequest, type PresentationRequestQuery, type PresentationRequestQueryExampleItem, type PresentationRequestQueryFrameItem, PresentationRequestQueryType, PresentationRequestQueryNewBelarusItem } from './request'
import { type PresentationRequestQueryBuilder } from './types'

export const buildW3cPresentationRequestBuilder: W3CUtilsPresentationRequestBulder = (challenge, type) => {
  type T = typeof type extends PresentationRequestQueryType.Frame ? PresentationRequestQueryFrameItem :
    typeof type extends PresentationRequestQueryType.Example ? PresentationRequestQueryExampleItem :
    typeof type extends PresentationRequestQueryType.SimpleZK ? PresentationRequestQueryNewBelarusItem
    : PresentationRequestQueryNewBelarusItem

  const request: PresentationRequest<T> = {
    challenge,
    query: []
  }

  return {
    interact: service => {
      request.interact = request.interact ?? { service: [] }
      request.interact.service.push(service)
    },

    query: () => {
      const query: PresentationRequestQuery<T> = {
        type: type ?? PresentationRequestQueryType.SimpleZK,
        credentialQuery: []
      }
      request.query.push(query)
      const builder: PresentationRequestQueryBuilder<T> = {
        query: queryItem => {
          if (Array.isArray(query.credentialQuery) && query.credentialQuery.length === 0) {
            query.credentialQuery = queryItem
          } else if (Array.isArray(query.credentialQuery)) {
            query.credentialQuery.push(queryItem)
          } else {
            query.credentialQuery = [query.credentialQuery, queryItem]
          }
          query.credentialQuery = Array.isArray(query.credentialQuery) ? query.credentialQuery : [query.credentialQuery]
        }
      }

      return builder
    },

    domain: domain => {
      request.domain = domain
    },

    build: () => request
  }
}
