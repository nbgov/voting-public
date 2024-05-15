import { Router } from 'express'
import { AUTH_PS_SIG } from './auth/method/ps-sig'
import { AUTH_TOKEN } from './auth/method/token'
import { type Authentication } from './auth/types'
import { census } from './routes/census'
import { dispatchProofspaceConfig } from './routes/config'
import { integration } from './routes/integration'
import { polls } from './routes/polls'
import { type PluginBuilder } from './server/types'
import { proofspace } from './routes/proofspace'
import { organizations } from './routes/organizations'
import { vocdoniCsp } from './routes/vocdoni'
import { newbelarusChallenge } from './routes/newbelarus'
import { telegram } from './routes/telegram'
import { audit } from './routes/audit'

export const createRouter = (auth: Authentication): PluginBuilder => () => {
  const router = Router()

  router.route('/hello').get((_, res) => {
    console.log('hello reached!')
    res.json({ status: 'OK' })
  })

  router.route('/hello-secured').get(...auth.ensure(), (_, res) => {
    console.log('hello-secured reached!')
    res.json({ status: 'OK' })
  })

  router.route('/audit/:id').get(audit.infoParams, audit.info)

  const authRtr = Router()
  authRtr.route('/proofspace').post(...auth.auth(AUTH_PS_SIG))
  authRtr.route('/pickup').get(...auth.pickUp())
  authRtr.route('/token').all(...auth.auth(AUTH_TOKEN))
  router.use('/auth', authRtr)

  const regRtr = Router()
  regRtr.route('/proofspace').post(...auth.auth(AUTH_PS_SIG))
  regRtr.route('/proofspace/issue').post(
    ...auth.ensure(), proofspace.sendWalletBody, proofspace.sendWallet
  )
  router.use('/register', regRtr)

  const cfgRtr = Router()
  cfgRtr.route('/proofspace').get(dispatchProofspaceConfig)
  router.use('/config', cfgRtr)

  const intRtr = Router()
  intRtr.route('/:id').post(
    ...auth.ensure(), integration.postIdParams, integration.postToIdBody, integration.postToId
  )
  router.use('/integration', intRtr)

  const pollRtr = Router()
  pollRtr.route('/').post(...auth.ensure(), polls.create)
    .get(
      polls.listParams, polls.listQuery, polls.listAll
    )
  pollRtr.route('/:id').get(
    auth.pass(true), polls.loadParams, polls.loadQuery, polls.load
  ).patch(...auth.ensure(), polls.update)
    .delete(...auth.ensure(), polls.delete)
  pollRtr.route('/:service/:org').get(
    polls.listParams, polls.listQuery, polls.list
  )
  router.use('/polls', pollRtr)

  const orgRtr = Router()
  orgRtr.route('/:service/:id').get(
    organizations.loadParams, organizations.load
  )
  router.use('/orgs', orgRtr)

  const cenRtr = Router()
  cenRtr.route('/:id').post(
    ...auth.ensure(), census.censusParams, census.register
  ).get(
    auth.pass(true), census.censusParams, census.censusQuery, census.proof
  )
  router.use('/census', cenRtr)

  const verifnRtr = Router()
  verifnRtr.route('/vocdoni/auth/elections/:votingId/:authType/auth/:step').post(
    ...auth.ensure(), vocdoniCsp.stepParams, vocdoniCsp.stepBody, vocdoniCsp.step
  )
  verifnRtr.route('/vocdoni/auth/elections/:votingId/:authType/sign').post(
    ...auth.ensure(), vocdoniCsp.signParams, vocdoniCsp.signBody, vocdoniCsp.sign
  )
  verifnRtr.route('/vocdoni/auth/elections/info').get(vocdoniCsp.info)

  verifnRtr.route('/vocdoni-blind/auth/elections/:votingId/:authType/auth/:step').post(
    ...auth.ensure(), vocdoniCsp.stepParams, vocdoniCsp.stepBody, vocdoniCsp.step
  )
  verifnRtr.route('/vocdoni-blind/auth/elections/:votingId/:authType/sign').post(
    ...auth.ensure(), vocdoniCsp.signParams, vocdoniCsp.signBody, vocdoniCsp.sign
  )
  verifnRtr.route('/vocdoni-blind/auth/elections/info').get(vocdoniCsp.infoBlind)

  verifnRtr.route('/newbelarus/poll/:votingId/start').get(
    newbelarusChallenge.startParams, newbelarusChallenge.start
  )
  verifnRtr.route('/newbelarus/poll/:votingId/verify').post(
    ...auth.ensure(), newbelarusChallenge.verifyParams, newbelarusChallenge.verify
  )
  router.use('/verification', verifnRtr)

  const tgRtr = Router()
  tgRtr.route('/auth').post(
    telegram.authenticateBody, telegram.authenticate
  )
  tgRtr.route('/auth/poll').post(
    telegram.authenticatePollBody, telegram.authenticatePoll
  )
  router.use('/telegram', tgRtr)

  return router
}
