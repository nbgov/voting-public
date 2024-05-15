import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import type { FunctionComponent } from 'react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useCtx } from '../../context'

export const DebugAuth: FunctionComponent = () => {
  const context = useCtx()
  const { control, handleSubmit, setError } = useForm<DebugAuthFields>({ defaultValues: { authToken: '' } })
  const [success, setSuccess] = useState<boolean>(false)

  const test = async (data: DebugAuthFields): Promise<void> => {
    const result = await auth(data)

    if (result !== true) {
      setSuccess(false)
      setError('authToken', { type: 'unknown', message: `We can't authenticate token ${result}` })
    } else {
      setSuccess(true)
    }
  }

  const auth = async (data: DebugAuthFields): Promise<string | true> =>
    await context.web.authenticateToken(data.authToken)

  return <Grid container direction="row" justifyContent="flex-start" alignItems="stretch">
    <Grid item xs={4}>
      <Controller name="authToken" control={control} render={
        ({ field: { onChange, value }, fieldState: { invalid, error } }) =>
          <TextField error={invalid} fullWidth onChange={onChange} value={value} label={invalid ? error?.message : 'Auth Token'} />
      } />
    </Grid>
    {
      success
        ? <Grid container item xs={1} alignItems="center" justifyContent="center">
          OK
        </Grid>
        : undefined
    }
    <Grid container item xs={3} direction="column" alignItems="center" justifyContent="center">
      <Button onClick={handleSubmit(auth) /* eslint-disable-line @typescript-eslint/no-misused-promises */}
        variant="contained" size="large">Authetnicate</Button>
    </Grid>
    <Grid container item xs={1} direction="column" alignItems="center" justifyContent="center">
      <Button onClick={handleSubmit(test) /* eslint-disable-line @typescript-eslint/no-misused-promises */}
        variant="contained" size="large">Test</Button>
    </Grid>
  </Grid>
}

interface DebugAuthFields { authToken: string }
