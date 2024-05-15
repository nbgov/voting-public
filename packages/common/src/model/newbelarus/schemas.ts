import type { IEmbeddedJsonSchema } from '@docknetwork/crypto-wasm-ts'

/**
 * @TODO to update with: 
 * https://github.com/nbgov/cred-issuer/blob/8bf763744b30222844c26299abff26f9f0501f57/src/const.js#L44
 */
export const newBelarusPassportDockJsonSchema: Partial<IEmbeddedJsonSchema> = {
  definitions: {
    didId: { type: 'string', format: 'uri' }
  },
  properties: {
    id: { $ref: '#/definitions/didId' },
    holder: { $ref: '#/definitions/didId' },
    issuer: { $ref: '#/definitions/didId' },
    type: { type: 'string' },
    // validFrom: { type: 'string', format: 'date-time' },
    // validUntil: { type: 'string', format: 'date-time' },
    credentialSubject: {
      properties: {
        docId: { type: 'string' },
        issuedAt: { type: 'string', format: 'date' },
        validUntil: { type: 'string', format: 'date' },
        personId: { type: 'string' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        gender: { type: 'string' },
        placeOfBirth: { type: 'string' },
        dateOfBirth: { type: 'string', format: 'date' },
        nationality: { type: 'string' },
        country: { type: 'string' },
        authority: { type: 'string' },
        photo: { type: 'string' },
      }
    }
  }
}

export const mockNewBelarusPassportSubjectDock = {
  docId: 'BL1882-ISSUE',
  issuedAt: new Date().toLocaleString(),
  validUntil: new Date().toLocaleString(),
  personId: '03031882A23423RB',
  firstName: 'Jakub',
  lastName: 'Kolas',
  gender: 'M',
  placeOfBirth: 'Akinchytsy',
  dateOfBirth: new Date().toLocaleString(),
  nationality: 'Belarus',
  country: 'BY',
  authority: 'IDK',
  photo: ''
}
