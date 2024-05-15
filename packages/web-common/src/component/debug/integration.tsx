import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import { DEFAULT_MEMBER_NAME, randomToken, type User, type IntegrationParams, type OrgInfo } from '@smartapps-poll/common'
import { type FunctionComponent, useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useCtx } from '../../context'
import { buildIntegration } from '../../integration'

const _filterEmpty = (value: string | undefined): string => {
  return value == null || value === '' ? randomToken() : value
}

export const DebugIntegration: FunctionComponent<DebugIntegrationProps> = ({ auth }) => {
  const context = useCtx()
  const [error, setError] = useState<string | undefined>(undefined)
  const { register, handleSubmit, watch } = useForm<DebugIntegrationFields>({
    defaultValues: {
      auth: auth ?? '',
      serviceId: context.integration?.params.serviceId ?? 'XXX',
      org: {
        name: 'Some test organization',
        shortDescr: 'Some test organization description',
        logoUrl: `https://picsum.photos/seed/${context.integration?.params.authorization.orgId ?? ''}/200/200`
      },
      authorization: {
        orgId: _filterEmpty(context.integration?.params.authorization.orgId),
        userId: _filterEmpty(context.integration?.params.authorization.userId),
        userToken: context.integration?.params.authorization.userToken ?? 'manager'
      }
    }
  })

  const simulate = async (data: DebugIntegrationFields): Promise<void> => {
    setError(undefined)
    context.integration = buildIntegration({
      serviceId: data.serviceId,
      ...(data.authorization.orgId !== '' ? { org: data.org } : {}),
      authorization: data.authorization
    })
    if (data.auth === '') {
      data.auth = randomToken()
    }
    // console.log('Full authentication set', data.auth)
    context.web.authenticated(data.auth)
    await context.strategy.wallet().createWallet()
    await context.strategy.service().account.create(DEFAULT_MEMBER_NAME)
    await context.strategy.service().account.fetchEntity()
    await context.web.client().post<User>(
      '/debug/account', { token: data.auth, address: await context.strategy.getAddress() }
    )
    await context.web.integration.authenticate(context.integration.params, DEFAULT_MEMBER_NAME)
    console.info('Integration set')
  }

  const apply = async (data: DebugIntegrationFields): Promise<void> => {
    setError(undefined)
    context.integration = buildIntegration({
      serviceId: data.serviceId,
      ...(data.authorization.orgId !== '' ? { org: data.org } : {}),
      authorization: data.authorization
    })
    if (data.auth !== '') {
      // console.log('Authentication set', data.auth)
      context.web.authenticated(data.auth)
      context.isAuthenticated = () => true
    }
    if (context.integration.params.authorization != null) {
      await context.web.integration.authenticate(context.integration.params, DEFAULT_MEMBER_NAME)
    }
    console.info('Integration set')
  }

  const test = async (data: DebugIntegrationFields): Promise<void> => {
    setError(undefined)
    await apply(data)
    try {
      console.log(await context.web.integration.authenticate(
        context.integration?.params as IntegrationParams, 'Test voter'
      ))
    } catch (e) {
      console.error(e)
      if (typeof e === 'string') {
        setError(e)
      } else if (e instanceof Error) {
        setError(e.message)
      } else {
        setError(`${e as string}`)
      }
    }
  }

  useEffect(() => {
    if (auth != null && auth !== '') {
      void handleSubmit(apply)()
    }
  }, [auth])

  const useOrg = watch('authorization.orgId') !== ''

  return <Grid container direction="column" justifyContent="flex-start" alignItems="stretch">
    {error != null
      ? <Alert title="Error" severity="error">
        {
          <Typography variant="body2">{error}</Typography>
        }
      </Alert>
      : undefined
    }

    <Grid item xs={4} p={1}>
      <TextField {...register('auth')} fullWidth label="Test authentication token" />
    </Grid>
    <Grid item xs={4} p={1}>
      <TextField {...register('serviceId')} fullWidth label="Integrated service ID" />
    </Grid>
    <Grid item xs={4} p={1}>
      <TextField {...register('authorization.userId')} fullWidth label="User / Member ID from integrated system" />
    </Grid>
    <Grid item xs={4} p={1}>
      <TextField {...register('authorization.userToken')} fullWidth label="User / Member authorization token for backend" />
    </Grid>
    <Grid item xs={4} p={1}>
      <TextField {...register('authorization.orgId')} fullWidth label="Organization ID" />
    </Grid>
    {useOrg
      ? <>
        <Grid item xs={4} p={1}>
          <TextField {...register('org.name')} fullWidth label="Organization name" />
        </Grid>
        <Grid item xs={4} p={1}>
          <TextField {...register('org.shortDescr')} fullWidth label="Organization short description"
            multiline={true} />
        </Grid>
      </>
      : undefined}

    <Grid item container xs={4} p={1} direction="row" alignItems="center" justifyContent="flex-end">
      <Grid container item xs={2} direction="column" alignItems="center" justifyContent="center">
        <Button onClick={handleSubmit(simulate) /* eslint-disable-line @typescript-eslint/no-misused-promises */}
          variant="contained" size="large">Simulate</Button>
      </Grid>
      <Grid container item xs={2} direction="column" alignItems="center" justifyContent="center">
        <Button onClick={handleSubmit(apply) /* eslint-disable-line @typescript-eslint/no-misused-promises */}
          variant="contained" size="large">Apply</Button>
      </Grid>
      <Grid container item xs={1} direction="column" alignItems="center" justifyContent="center">
        <Button onClick={handleSubmit(test) /* eslint-disable-line @typescript-eslint/no-misused-promises */}
          variant="contained" size="large">Test</Button>
      </Grid>
    </Grid>
  </Grid>
}

interface DebugIntegrationFields extends IntegrationParams {
  auth: string
  serviceId: string
  org: OrgInfo
}

interface DebugIntegrationProps {
  auth?: string

}
