import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { fromBase64 } from '@smartapps-poll/common'
import type { FunctionComponent } from 'react'
import { useController, useForm } from 'react-hook-form'
import { useCtx } from '../../../context'
import type { WebWallet } from '../../../service'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import { useTranslation } from 'react-i18next'

export const OpenWalletAsync: FunctionComponent<OpenWalletAsyncProps> = ({
  store, onCancel, onOpen
}) => {
  const ctx = useCtx()
  const { t } = useTranslation(undefined, { keyPrefix: 'common.auth.open' })
  const { register, handleSubmit, setError, control } = useForm<PasswordForm>({
    defaultValues: { password: '' }
  })

  const open = async (data: PasswordForm): Promise<void> => {
    try {
      const keystore = fromBase64(store)
      const wallet = await ctx.strategy.wallet().import(data.password, keystore)
      void onOpen(wallet as WebWallet)
    } catch (e) {
      console.error(e)
      setError('password', { message: t('error.broken') ?? '' })
    }
  }

  const { fieldState: pass } = useController({ control, name: 'password', rules: { required: t('error.passwordEmpty') ?? '' } })

  return <Card>
    <CardHeader title={t('header')} />
    <CardContent>
      <ul>
        <li><Typography variant="body2" color="text.secondary">{t('why.cause')}</Typography></li>
        <li><Typography variant="body2" color="text.secondary">{t('why.pincode')}</Typography></li>
        <li><Typography variant="body2" color="text.warning">{t('why.caution')}</Typography></li>
      </ul>
      <Grid container direction="column" justifyContent="space-evenly" alignItems="stretch">
        <Grid item p={1}>
          <TextField {...register('password')} fullWidth label={pass.error?.message ?? t('fields.password')}
            error={pass.invalid} type="password" autoComplete="on" />
        </Grid>
      </Grid>
    </CardContent>
    <CardActions sx={{ p: 3 }}>
      <Button variant="outlined" size="large" onClick={() => { void onCancel() }}>{t('actions.cancel')}</Button>
      <Button variant="contained" size="large" onClick={event => { void handleSubmit(open)(event) }}>{t('actions.open')}</Button>
    </CardActions>
  </Card>
}

export interface OpenWalletAsyncProps {
  store: string
  onOpen: (wallet: WebWallet) => Promise<void>
  onCancel: () => Promise<void>
}

interface PasswordForm {
  password: string
}
