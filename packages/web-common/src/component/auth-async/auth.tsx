import { useEffect, useState } from 'react'
import type { FunctionComponent } from 'react'
import Paper from '@mui/material/Paper'
import Card from '@mui/material/Card'
import CardMedia from '@mui/material/CardMedia'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import { useCtx } from '../../context'
import { type AuthPsSubject, hash, toBase64, randomToken, castIteraction, authPsType } from '@smartapps-poll/common'
import { buildInteraction } from '../../service/proofspace/interaction'
import { useInsist } from '../../client/insist'
import { AuthenticationError, CredentialsWalletError } from '../auth/errors'
import { type WebWallet } from '../../service'
import { useNavigation } from '../../app/navigation'
import { Navigator, Screen } from '../../app'
import { OpenWalletAsync } from './wallet/open'
import CardActions from '@mui/material/CardActions'
import { ProofspaceApps } from './apps'
import Stepper from '@mui/material/Stepper'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import StepContent from '@mui/material/StepContent'
import PsLogo from '../../../assets/pslogo.png'
import { useTranslation } from 'react-i18next'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'

export const ProofspaceAuthenticationAsync: FunctionComponent<ProofspaceAuthenticationAsyncProps> = ({
  onSuccess, onFailure
}) => {
  const ctx = useCtx()
  const { t } = useTranslation(undefined, { keyPrefix: 'common.auth.auth' })
  const nav = useNavigation({ defaultState: { screen: 'step1' } })
  const [keystore, setKeystore] = useState<string>('')
  const [[credential, token, salt], setCredential] = useState<[AuthPsSubject, string, string]>(() => {
    const salt = randomToken()
    const token = randomToken()
    const cred = { token: 'salted:' + hash(salt, token), issuedAt: new Date().toUTCString(), resource: 'test' }
    return [cred, token, salt]
  })
  const insist = useInsist<string>([credential])

  useEffect(() => {
    void (async () => {
      try {
        const config = await ctx.web.config.proofspace()
        if (config.authCred.interaction === undefined) {
          return
        }

        // const interaction = castIteraction(config.authCred.interaction)
        const outleted = await buildInteraction<AuthPsSubject>(config)
          .interaction(castIteraction(config.authCred.interaction))
          .use(config.authCred, authPsType, credential)
          .run('proofspace-auth', 300)

        if (!outleted) {
          throw new CredentialsWalletError('proofspace.qr.auth')
        }

        const pickup = await ctx.web.authenticateAndPickUp<string>(insist, toBase64(`${token}:${salt}`))
        if (!insist.stoped) {
          if (pickup != null) {
            ctx.web.authenticated(token)
            setKeystore(pickup.pickup)
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
  }, [credential])

  const fail = async (e: Error): Promise<void> => {
    insist.stop()
    nav.go({ screen: 'step1' })
    await onFailure(e)
  }

  const onOpenSuccess = async (wallet: WebWallet): Promise<void> => {
    ctx.strategy.wallet().setWallet(wallet)
    nav.go({ screen: 'step1' })
    await onSuccess()
  }

  const cancel = async (): Promise<void> => {
    insist.revive()
    nav.go({ screen: 'step1' })
    const salt = randomToken()
    const token = randomToken()
    const cred = { token: 'salted:' + hash(salt, token), issuedAt: new Date().toUTCString() }
    setCredential([cred, token, salt])
  }

  return <Grid item container direction="row" justifyContent="space-between" alignItems="stretch">
    <Grid item container md={9} minHeight={600} direction="column" justifyContent="center" alignItems="center">
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
                <CardMedia >
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
                    <div id="proofspace-auth"></div>
                  </Stack>
                </CardMedia>
                <CardContent>
                  <Typography variant="body1" color="text.secondary" textAlign="center" gutterBottom>
                    {t('step1.download')}
                  </Typography>
                </CardContent>
                <CardActions><ProofspaceApps /></CardActions>
              </Card>
            </Paper>
          </Grid>
        </Screen>
        <Screen screen="step2">
          <OpenWalletAsync onOpen={onOpenSuccess} onCancel={cancel} store={keystore} />
        </Screen>
      </Navigator>
    </Grid>
    <Grid item container xs={3} bgcolor="info.dark" p={2} direction="column" justifyContent="flex-start" alignItems="flex-start"
      sx={{ display: { xs: 'none', sm: 'none', md: 'flex' } }}>
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
              <Typography variant="body2" color="white">{t('stepper.descr2')}</Typography>
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

export interface ProofspaceAuthenticationAsyncProps {
  onSuccess: () => Promise<void>
  onFailure: (e: Error) => Promise<void>
}
