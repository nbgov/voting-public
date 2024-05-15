import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import { ProgressButton, useToggle } from '@smartapps-poll/web-common'
import { Dispatch, FC, SetStateAction } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useCtx } from '../../../shared'
import { Typography } from '@mui/material'

export const ClaimFaucets: FC<ClaimFaucetsProps> = ({ setTokens }) => {
  const ctx = useCtx()
  const { t } = useTranslation(undefined, { keyPrefix: 'manager.vocdoni.faucet' })
  const toggle = useToggle(true)
  const { control, handleSubmit, setError } = useForm<FaucetForm>({ defaultValues: { token: '' } })

  const claim = async (data: FaucetForm): Promise<void> => {
    try {
      toggle.close()
      const tokens = await ctx.strategy.service().account.collectFaucetTokens(
        data.token == null || data.token == '' ? undefined : data.token
      )
      setTokens(tokens)
    } catch (e) {
      if (e instanceof Error) {
        setError('token', { message: e.message })
      }
    } finally {
      toggle.open()
    }
  }

  return <Grid container direction="row" justifyContent="flex-start" alignItems="center" spacing={1}>
    <Grid item xs={6}>
      <Controller control={control} name="token" render={
        ({ field, fieldState }) => <TextField {...field} fullWidth error={fieldState.invalid}
          label={t(fieldState.invalid ? `error.${fieldState.error?.message}` : 'field.token')} 
          size="small"/>
      } />
    </Grid>
    <Grid item xs={6}>
      <ProgressButton toggle={toggle} onClick={handleSubmit(claim)}>{t('action.claim')}</ProgressButton>
    </Grid>
    <Grid item xs={12}>
      <Typography>https://app-stg.vocdoni.io/faucet</Typography>
    </Grid>
  </Grid>
}

export interface FaucetForm {
  token: string
}

export interface ClaimFaucetsProps {
  setTokens: Dispatch<SetStateAction<number>>
}
