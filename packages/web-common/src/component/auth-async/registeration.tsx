import { useEffect, useState } from 'react'
import type { FunctionComponent } from 'react'
import { useCtx } from '../../context'
import Paper from '@mui/material/Paper'
import Card from '@mui/material/Card'
import CardMedia from '@mui/material/CardMedia'
import Grid from '@mui/material/Grid'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import { type AsyncRegistrationPsSubject, asyncRegistrationPsType, castIteraction, hash, randomToken, toBase64 } from '@smartapps-poll/common'
import { useInsist } from '../../client/insist'
import { buildInteraction } from '../../service/proofspace/interaction'
import { useToggle } from '../utils/toggle'
import { Backdrop } from '../utils/backdrop'
import { AuthenticationError, CredentialsWalletError } from '../auth/errors'
import { useNavigation } from '../../app/navigation'
import { Navigator, Screen } from '../../app'
import { CreateWalletAsync } from './wallet/create'
import Stepper from '@mui/material/Stepper'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import StepContent from '@mui/material/StepContent'
import CardActions from '@mui/material/CardActions'
import PsLogo from '../../../assets/pslogo.png'
import { ProofspaceApps } from './apps'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import { useTranslation } from 'react-i18next'

export const ProofspaceRegisterationAsync: FunctionComponent<ProofspaceRegisterationAsyncProps> = ({
  onCreate, onFailure, onCancel
}) => {
  const ctx = useCtx()
  const { t } = useTranslation(undefined, { keyPrefix: 'common.auth.register' })
  const nav = useNavigation({ defaultState: { screen: 'step1' } })
  const backdrop = useToggle(false)
  const [[credential, token, salt], setCredential] = useState<
  [AsyncRegistrationPsSubject, string, string]
  >(() => {
    const salt = randomToken()
    const token = randomToken()
    const cred = { token: 'salted:' + hash(salt, token), address: '' }
    return [cred, token, salt]
  })

  const insist = useInsist()

  useEffect(() => {
    void (async () => {
      try {
        await ctx.strategy.wallet().createWallet()
        const cred = { ...credential, address: await ctx.strategy.wallet().getAddress() ?? '' }
        setCredential([cred, token, salt])

        const config = await ctx.web.config.proofspace()
        if (config.regCred.interaction === undefined) {
          return
        }

        const outleted = await buildInteraction<AsyncRegistrationPsSubject>(config)
          .interaction(castIteraction(config.regCred.interaction))
          .use(config.regCred, asyncRegistrationPsType, cred)
          .run('proofspace-register', 250)

        if (!outleted) {
          throw new CredentialsWalletError('proofspace.qr.register')
        }

        const pickup = await ctx.web.authenticateAndPickUp<undefined>(insist, toBase64(`${token}:${salt}`))
        if (!insist.stoped) {
          if (pickup != null) {
            ctx.web.authenticated(token)
            nav.go({ screen: 'step2' })
          } else {
            void fail(new AuthenticationError())
          }
        }
      } catch (e) {
        console.error(e)
        void fail(e as Error)
      }
    })()
  }, [salt])

  const fail = async (e: Error): Promise<void> => {
    insist.stop()
    backdrop.close()
    nav.go({ screen: 'step1' })
    await onFailure(e)
  }

  const cancel = async (): Promise<void> => {
    insist.stop()
    nav.go({ screen: 'step1' })
    backdrop.close()
    await onCancel()
  }

  const onWalletCreate = async (name: string, address: string, store: string): Promise<void> => {
    backdrop.open()
    const result = await ctx.web.client().post<{ ok: boolean }>('/register/proofspace/issue', { store, address })
    if (result.data.ok) {
      await ctx.strategy.service().account.create(name)

      void onCreate()
    } else {
      void fail(new AuthenticationError())
      nav.go({ screen: 'step1' })
    }
    backdrop.close()
  }

  const onBeforeWalletCreate = async (): Promise<void> => {
    backdrop.open()
  }

  return <Grid item container direction="row" justifyContent="space-between" alignItems="stretch">
    <Grid item container xs={9} minHeight={600} direction="column" justifyContent="center" alignItems="center">
      <Navigator navigation={nav}>
        <Screen screen="step1">
          <Grid item>
            <Typography variant="h3" gutterBottom>{t('step1.title')}</Typography>
            <Typography variant="body1" gutterBottom>{t('step1.walletWhy')}</Typography>
            <Typography variant="body1" gutterBottom>{t('step1.scan')}</Typography>
          </Grid>
          <Grid item>
            <Paper sx={{ maxWidth: 450 }}>
              <Card>
                <CardMedia>
                  <Stack p={1} direction="row" justifyContent="center" alignItems="stretch">
                    <Box sx={{
                      width: 150,
                      height: 50,
                      backgroundImage: `url(${PsLogo})`, // eslint-disable-line
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'center center',
                      backgroundSize: 'contain'
                    }} />
                  </Stack>
                  <Stack p={2} direction="row" justifyContent="center" alignItems="stretch">
                    <div id="proofspace-register"></div>
                  </Stack>
                </CardMedia>
                <CardContent>
                  <Typography variant="body1" color="text.secondary" textAlign="center" gutterBottom>{t('step1.download')}</Typography>
                </CardContent>
                <CardActions><ProofspaceApps /></CardActions>
              </Card>
            </Paper>
          </Grid>
        </Screen>
        <Screen screen="step2">
          <Grid item>
            <Typography variant="h3" gutterBottom>{t('step2.title')}</Typography>
          </Grid>
          <Grid item>
            <CreateWalletAsync onCreate={onWalletCreate} onBeforeCreate={onBeforeWalletCreate} onCancel={cancel} onFailure={fail} />
          </Grid>
        </Screen>
      </Navigator>
      <Backdrop toggle={backdrop} />
    </Grid>
    <Grid item container xs={3} bgcolor="info.dark" p={2} direction="column" justifyContent="flex-start" alignItems="flex-start" >
      <Grid item container xs={4} direction="column" justifyContent="flex-end" alignItems="stretch">
        <Typography variant="h4" gutterBottom color="white">{t('stepper.header')}</Typography>
      </Grid>
      <Grid item container xs={8} direction="column" justifyContent="space-even" alignItems="stretch">
        <Stepper orientation="vertical" activeStep={{ step1: 0, step2: 1 }[nav.current().screen] ?? 0}>
          <Step>
            <StepLabel>
              <Typography variant="body1" color="white">{t('stepper.title1')}</Typography>
            </StepLabel>
            <StepContent>
              <Typography variant="body2" color="white">{t('stepper.descr1')}</Typography>
            </StepContent>
          </Step>
          <Step>
            <StepLabel>
              <Typography variant="body1" color="white">{t('stepper.title2')}</Typography>
            </StepLabel>
            <StepContent>
              <Typography variant="body2" color="white">{t('stepper.title2')}</Typography>
            </StepContent>
          </Step>
          <Step>
            <StepLabel>
              <Typography variant="body1" color="white">{t('stepper.title3')}</Typography>
            </StepLabel>
          </Step>
        </Stepper>
      </Grid>
    </Grid>
  </Grid>
}

export interface ProofspaceRegisterationAsyncProps {
  onCreate: () => Promise<void>
  onFailure: (e: Error) => Promise<void>
  onCancel: () => Promise<void>
}
