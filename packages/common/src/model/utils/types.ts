
export interface Pagination {
  page: number
  size: number
  total?: number
}

export interface Pager extends Partial<Pagination> {
}

export interface Listed<T = unknown> {
  pager: Pagination
  list: T[]
}

export interface ContentImage {
  type: ContentImageType
  fullUrl: string
}

export enum ContentImageType {
  Remote = 'remote'
}
