import { type PresentationRequest, type PresentationRequestInteractService, type PresentationRequestQueryItem } from './request'

export interface W3CPresentationRequestBuilder<T extends PresentationRequestQueryItem> {
  build: () => PresentationRequest<T>
  query: () => PresentationRequestQueryBuilder<T>
  domain: (domain: string) => void
  interact: (interact: PresentationRequestInteractService) => void
}

export interface PresentationRequestQueryBuilder<T extends PresentationRequestQueryItem> {
  query: (query: T) => void
}
