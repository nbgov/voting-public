import type { Resource } from './types'

export class ResourceError extends Error {
  constructor (resource: Resource, messsage?: string) {
    super(
      messsage !== undefined
        ? `${messsage} ${resource.alias}`
        : `Unkown error with app resource ${resource.alias}`
    )
    this.name = 'ResourceError'
  }
}
