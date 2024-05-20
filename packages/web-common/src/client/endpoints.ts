
export const defaultEndpoints = {
  auth: { token: '/auth/token', pickup: '/auth/pickup' },
  config: { proofspace: '/config/proofspace' },
  integration: { toId: '/integration/' },
  verification: {
    vocdoni: '/verification/vocdoni',
    vocdoniBlind: '/verification/vocdoni-blind',
    newbelarus: {
      startPrefix: '/verification/newbelarus/poll/',
      startSuffix: '/start',
      verifyPrefix: '/verification/newbelarus/poll/',
      verifySuffix: '/verify'
    }
  },
  polls: { list: '/polls', entity: '/polls/' },
  census: { poll: '/census/' },
  orgs: { entity: '/orgs/' },
  telegram: { 
    auth: '/telegram/auth',
    authPoll: '/telegram/auth/poll'
  },
  veriff: {
    init: '/veriff/init/'
  }
}

export type DefualtEndpoints = typeof defaultEndpoints
