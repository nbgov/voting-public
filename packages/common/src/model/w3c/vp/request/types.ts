
export type FramedPresentationRequest = PresentationRequest<PresentationRequestQueryFrameItem>

export type NewBelarusPresentationRequest = PresentationRequest<PresentationRequestQueryNewBelarusItem>

export interface PresentationRequest<T extends PresentationRequestQueryItem> {
  query: Array<PresentationRequestQuery<T>>
  interact?: PresentationRequestInteract
  challenge: string
  domain?: string
}

export interface PresentationRequestQuery<T extends PresentationRequestQueryItem> {
  type: PresentationRequestQueryType
  credentialQuery: MaybeArray<T>
}

export interface PresentationRequestQueryItem {
  required?: boolean
  reason: string
  trustedIssuer?: MaybeArray<PresentationRequestQueryIssuer>
}

export interface PresentationRequestQueryExampleItem extends PresentationRequestQueryItem {

}

export interface  PresentationRequestQueryNewBelarusItem extends PresentationRequestQueryItem {
  filter?: Record<string, unknown>
  attributes?: string[]
}

export interface PresentationRequestQueryFrameItem extends PresentationRequestQueryItem {
  frame: {
    type?: MaybeArray<string>
    issuer?: string
    credentialSubject?: Record<string, unknown>
  }
}

export interface PresentationRequestQueryIssuer {
  required?: boolean
  issuer: string
}

export interface PresentationRequestInteract {
  service: PresentationRequestInteractService[]
}

export interface PresentationRequestInteractService {
  type: string
  serviceEndpoint: string
}

export enum PresentationRequestQueryType {
  Frame = 'QueryByFrame',
  Example = 'QueryByExample',
  SimpleZK = 'SimpleZKQuery'
}

export type MaybeArray<T> = T | T[]
