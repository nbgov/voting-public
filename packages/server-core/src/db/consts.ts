
// export const WRAPPER_KEY_ALGORITHM = { name: 'AES-KW', length: 256 }
export const GCM_WRAPPER_KEY_ALGORITHM = { name: 'AES-GCM', length: 256 }

// export const ECDSA_ALGORITHM_FORWRAPPING: EcKeyImportParams = { name: 'ECDSA', namedCurve: 'SECP256K1' }

// export const WRAPPER_KEY_PURPOSES: Array<KeyUsage> = ['wrapKey', 'unwrapKey']
export const WRAPPER_GCMKEY_PURPOSES: Array<KeyUsage> = ['encrypt', 'decrypt']

export const WRAPPED_PERFIX = 'wrapped:'
