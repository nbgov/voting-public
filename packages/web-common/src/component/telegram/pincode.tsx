import type { FC } from 'react'
import type { ModalBodyProps } from '../utils/types'
import DialogContent from '@mui/material/DialogContent'
import Card from '@mui/material/Card'
import { useTranslation } from 'react-i18next'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Link from '@mui/material/Link'
import { type PollInfo, TELEGRAM_STRATEGY, type TelegramRequiredProof } from '@smartapps-poll/common'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import { Controller, useForm } from 'react-hook-form'
import { TgPinCodeForm } from './types'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import { TGPIN_OK } from './consts'

export const makeTelegramPincode = (poll: PollInfo, authPin: (pin: string) => Promise<boolean>, noCancel?: boolean): FC<ModalBodyProps> => {
  const tgProof = poll.requiredProofs?.find(
    proof => proof.type === TELEGRAM_STRATEGY && proof.isMandatory
  ) as TelegramRequiredProof | undefined

  return ({ callback }) => {
    const { t } = useTranslation(undefined, { keyPrefix: 'common.auth.telegram' })
    const { control, handleSubmit, setError } = useForm<TgPinCodeForm>({ mode: 'onChange', defaultValues: { pin: '' } })

    const submit = async (data: TgPinCodeForm) => {
      try {
        if (await authPin(data.pin)) {
          callback(TGPIN_OK)
        } else {
          setError("pin", { type: "wrong" })
        }
      } catch (e) {
        setError("pin", { type: "unknown" })
      }
    }

    return <>
      <DialogContent>
        <Card>
          <CardHeader title={t('header')} />
          <CardContent>
            <Typography variant="body2">{t('why.main')}</Typography>
            <ul>
              <li><Typography variant="body2">{t('why.primary')}</Typography></li>
              {tgProof?.meta?.botUrl ? <li>
                <Typography variant="body2">{t('why.secondary')}</Typography>
                <Link href={tgProof.meta.botUrl} variant="body1">{tgProof.meta.botUrl}</Link>
              </li> : undefined}
            </ul>
            <Grid container direction="column" justifyContent="space-evenly" alignItems="stretch">
              <Grid item p={1}>
                <Controller control={control} name="pin"
                  rules={{ required: true, minLength: 4, maxLength: 9, pattern: /^\d+$/ }}
                  render={({ field, fieldState }) =>
                    <TextField {...field} fullWidth error={fieldState.invalid} label={t('field.pin.label')}
                      helperText={t(
                        fieldState.invalid
                          ? `field.pin.error.${fieldState.error?.type ?? 'unknown'}`
                          : `field.pin.hint`
                      )} />
                  } />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </DialogContent>
      <DialogActions>
        {noCancel != true
          ? <Button variant="outlined" onClick={() => callback(undefined)}>{t('action.cancel')}</Button>
          : undefined}
        <Button variant="contained" onClick={handleSubmit(submit)}>{t('action.auth')}</Button>
      </DialogActions>
    </>
  }
}
