import type { IEmbeddedJsonSchema, BBSPlusSignatureParamsG1 } from '@docknetwork/crypto-wasm-ts'
import { dockNBPrefedinedActions } from './consts'
import { DockActionToW3CReason, type DockActionRequest } from './types'
import { MaybeArray, type NewBelarusPresentationRequest } from '../w3c'
import { w3cUtils } from '../w3c/utils'

export const addExpectedIssuerToDockAction = (actionId: string, issuer: string) => {
  const action = dockNBPrefedinedActions.find(action => action.actionId === actionId)
  if (action != null && action.allowedIssuers != null) {
    action.allowedIssuers.push(issuer)
  }
}

export const expandDockSchema = (schema: Partial<IEmbeddedJsonSchema>, basic: IEmbeddedJsonSchema): IEmbeddedJsonSchema => {
  return {
    ...basic,
    definitions: {
      ...basic.definitions,
      ...schema.definitions
    },
    properties: {
      ...basic.properties,
      ...schema.properties,
      credentialSubject: {
        ...basic.properties.credentialSubject,
        ...schema.properties?.credentialSubject,
        ...(
          schema.properties?.credentialSubject != null
            ? {
              properties: {
                ...(basic.properties.credentialSubject as Record<string, object>).properties,
                ...(schema.properties.credentialSubject as Record<string, object>).properties
              }
            }
            : {}
        )
      }
    }
  }
}

export const generateDockSignatureParams = (
  Generator: typeof BBSPlusSignatureParamsG1,
  schema: Partial<IEmbeddedJsonSchema> | IEmbeddedJsonSchema,
  labelOrParams: Uint8Array | BBSPlusSignatureParamsG1,
  basic?: IEmbeddedJsonSchema): BBSPlusSignatureParamsG1 => {
  if (!isFullDockSchema(schema)) {
    if (basic == null) {
      throw new Error('partial.schema')
    }
    schema = expandDockSchema(schema, basic)
  }

  return Generator.getSigParamsForMsgStructure(schema, labelOrParams)
}

export const isFullDockSchema = (schama: Partial<IEmbeddedJsonSchema> | IEmbeddedJsonSchema): schama is IEmbeddedJsonSchema =>
  schama.$schema != null

export const dockActionRequestToW3C = (actionRequest: MaybeArray<DockActionRequest>, reasons: DockActionToW3CReason, origin?: string): NewBelarusPresentationRequest => {
  actionRequest = Array.isArray(actionRequest) ? actionRequest : [actionRequest]
  const firstRequest = actionRequest[0]
  const builder = w3cUtils.presentation.request.builder(firstRequest.challenge)
  if (origin != null) {
    builder.domain(origin)
  }

  for (const request of actionRequest) {
    const query = builder.query()
    for (let idx = 0; idx < request.credentialsRequired.length; ++idx) {
      const type = request.credentialsRequired[idx]
      query.query({
        reason: reasons[type] ?? 'reason.unknown',
        filter: {
          type,
          issuer: Array.isArray(request.allowedIssuers) ? request.allowedIssuers[idx] : undefined,
        },
        required: request.optionalCredentials != null && request.optionalCredentials[idx] !== undefined
          ? !request.optionalCredentials[idx] : true,
        attributes: request.fieldsToReveal[idx]
      })
    }
  }

  // builder.interact({
  //   type: NEWBELARUS_MEDIATED_REQUEST_TYPE,
  //   serviceEndpoint: `rpc://localhost/create-presentation/${actionRequest.actionId}`
  // })

  return builder.build()
}
