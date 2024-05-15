import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { DEFAULT_MEMBER_NAME } from '@smartapps-poll/common'
import { type FunctionComponent } from 'react'
import { useController, useForm } from 'react-hook-form'
import { useCtx } from '../../../context'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import { useTranslation } from 'react-i18next'

export const CreateWalletAsync: FunctionComponent<CreateWalletAsyncProps> = ({
  onCreate, onBeforeCreate, onFailure, onCancel
}) => {
  const ctx = useCtx()
  const { t } = useTranslation(undefined, { keyPrefix: 'common.auth.create' })
  const { register, handleSubmit, setError, control } = useForm<PasswordForm>({
    defaultValues: {
      name: DEFAULT_MEMBER_NAME,
      password: '',
      confirmation: ''
    }
  })

  const create = async (data: PasswordForm): Promise<void> => {
    if (data.password !== data.confirmation) {
      setError('confirmation', { message: t('error.passwordMatch') ?? '' })
      return
    }

    onBeforeCreate != null && await onBeforeCreate()
    try {
      if (ctx.strategy.wallet().get() == null) {
        await ctx.strategy.wallet().createWallet()
      }

      void onCreate(
        data.name,
        await ctx.strategy.getAddress() ?? '',
        await ctx.strategy.wallet().export(data.password)
      )
    } catch (e) {
      console.error(e)
      if (onFailure != null) {
        void onFailure(e as Error)
      }
    }
  }

  const { fieldState: name } = useController({ control, name: 'name', rules: { required: t('error.nameEmpty') ?? '' } })
  const { fieldState: pass } = useController({ control, name: 'password', rules: { required: t('error.passwordEmpty') ?? '' } })
  const { fieldState: confirm } = useController({ control, name: 'confirmation' })

  return <Card>
    <CardHeader title={t('header')} />
    <CardContent>
      <Typography variant="h6" gutterBottom textAlign="center">{t('subheader')}</Typography>
      <ul>
        <li><Typography variant="body2" color="text.secondary">{t('why.cause')}</Typography></li>
        <li><Typography variant="body2" color="text.secondary">{t('why.proofspace')}</Typography></li>
        <li><Typography variant="body2" color="text.secondary">{t('why.pincode')}</Typography></li>
        <li><Typography variant="body2" color="text.secondary">{t('why.precaution')}</Typography></li>
      </ul>
      <Typography variant="h6" color="error.dark">{t('why.remember')}</Typography>
      <Grid container direction="column" justifyContent="space-evenly" alignItems="stretch">
        <Grid item p={1}>
          <TextField {...register('name')} fullWidth label={name.error?.message ?? t('fields.name')}
            error={name.invalid} />
        </Grid>
        <Grid item p={1}>
          <TextField {...register('password')} fullWidth label={pass.error?.message ?? t('fields.password')}
            error={pass.invalid} type="password" autoComplete="off" />
        </Grid>
        <Grid item p={1}>
          <TextField {...register('confirmation')} fullWidth label={confirm.error?.message ?? t('fields.confirmation')}
            error={confirm.invalid} type="password" autoComplete="off" />
        </Grid>
      </Grid>
    </CardContent>
    <CardActions sx={{ p: 3 }}>
      <Button variant="outlined" size="large" onClick={() => { void onCancel() }}>{t('actions.cancel')}</Button>
      <Button variant="contained" size="large" onClick={event => { void handleSubmit(create)(event) }}>{t('actions.create')}</Button>
    </CardActions>
  </Card>
}

export interface CreateWalletAsyncProps {
  onCreate: (name: string, address: string, store: string) => Promise<void>
  onFailure?: (e: Error) => Promise<void>
  onBeforeCreate?: () => Promise<void>
  onCancel: () => Promise<void>
}

interface PasswordForm {
  name: string
  password: string
  confirmation: string
}
