
export interface PsPubKeyRequest {
  pattern: string
  key: string 
  did: string
}

export interface PsPubKeyResponse {
  publicKey: string
}
