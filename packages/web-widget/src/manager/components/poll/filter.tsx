import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import { type ChangeEvent, type FC } from 'react'
import { useFormContext, Controller, ControllerRenderProps } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { type PollCreationForm } from './types'
import { useCtx } from '../../../shared'
import { ProofspaceFilter } from '../proofspace/filter'
import FormHelperText from '@mui/material/FormHelperText'
import { VocdoniCensusTypeSelect } from '../vocdoni/census-type'
import { CensusTypeValues, NEWBELARUS_STRATEGY, PROOFSPACE_STRATEGY, SKIP_CRED_SOURCE, VOCDONI_CENSUS_CSP_BLINDNS, VOCDONI_CENSUS_CSP_NBNS, VOCDONI_CENSUS_OFFCHAIN, tgValidators } from '@smartapps-poll/common'
import { VocdoniCunsusSize } from '../vocdoni/cesnus-size'
import { AuthCredentialSourceSelect } from './cred-source'
import { NewBelarusFilter } from '../newbelarus/filter'
import Grid from '@mui/material/Grid'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import TextField from '@mui/material/TextField'
import FormLabel from '@mui/material/FormLabel'
import FormGroup from '@mui/material/FormGroup'

export const CensusFilter: FC = () => {
  const ctx = useCtx()
  const { t } = useTranslation(undefined, { keyPrefix: 'manager.census.filter' })
  const { t: et } = useTranslation()
  const { control, trigger, watch } = useFormContext<PollCreationForm>()

  const CredProviderTypeRenderer: FC = (props) => {
    switch (ctx.strategy.creds().getType()) {
      case PROOFSPACE_STRATEGY:
      default:
        return <VocdoniCensusTypeSelect {...props} />
    }
  }

  const SelectCredRenderer: FC<CredSourceRenderer> = props => {
    switch (props.credSource) {
      case NEWBELARUS_STRATEGY:
        return <NewBelarusFilter {...props} />
      case PROOFSPACE_STRATEGY:
      default:
        return <ProofspaceFilter {...props} />
    }
  }

  const isTgRequired = watch('tg.requireId')
  const credSources = watch('credSources')
  const censusType = watch('census.type')
  const validators = watch('tg.validators') ?? []

  const onChangeTgValidator = (field: ControllerRenderProps<PollCreationForm, "tg.validators">, validator: string) => (e: ChangeEvent<HTMLInputElement>) => {
    const _validators = validators.filter(val => val !== validator)
    field.onChange([..._validators, ...(e.target.checked ? [validator] : [])])
    trigger()
  }

  return <>
    <Grid container direction="row" justifyContent="space-around" alignItems="flex-start">
      {credSources.map((_credSource, idx) =>
        <Grid item key={idx} xs={6} sx={{ px: 1 }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="cred-source-select-label">{t('source.title')}</InputLabel>
            <AuthCredentialSourceSelect index={idx} />
            <FormHelperText>{t('source.hint')}</FormHelperText>
          </FormControl>
        </Grid>
      )}
    </Grid>

    <FormControl fullWidth sx={{ mb: 2 }}>
      <InputLabel id="census-type-select-label">{t('type.title')}</InputLabel>
      <CredProviderTypeRenderer />
      <FormHelperText>{t('type.hint')}</FormHelperText>
    </FormControl>
    {
      (() => {
        switch (censusType) {
          case VOCDONI_CENSUS_CSP_BLINDNS:
          case VOCDONI_CENSUS_CSP_NBNS:
            return <VocdoniCunsusSize />
          case VOCDONI_CENSUS_OFFCHAIN:
          default:
            return undefined
        }
      })()
    }
    <Grid container direction="row">
      {credSources.map((credSource, idx) =>
        credSource === SKIP_CRED_SOURCE ? undefined : <Grid item key={idx} xs={6} sx={{ px: 1 }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="census-filter-select-label">{t('select.title')}</InputLabel>
            <SelectCredRenderer credSource={credSource} index={idx} />
            <FormHelperText>{t('select.hint')}</FormHelperText>
          </FormControl>
        </Grid>
      )}
    </Grid>

    <Controller control={control} name="tg.requireId" defaultValue={false} render={({ field, fieldState }) => {
      return (
        <FormControl fullWidth sx={{ mb: isTgRequired ? 1 : 2 }}>
          <FormControlLabel control={<Checkbox {...field} checked={field.value} value="true" onChange={(e) => {
            field.onChange(e.target.checked)
            trigger()
          }} />} {...field} label={t('tg.title')} />
          <FormHelperText error={fieldState.invalid}>{fieldState.invalid ? fieldState.error?.message : t('tg.hint')}</FormHelperText>
        </FormControl>
      )
    }} />

    {isTgRequired ? <>
      <Controller control={control} name="tg.botUrl" rules={{
        validate: (val: string) => val == '' || val.match(/^https\:\/\//) != null ? true : 'error.tg.botUrl'
      }} render={({ field, fieldState }) => (
        <FormControl fullWidth sx={{ mb: 1 }}>
          <TextField {...field} fullWidth label={t('tg.botUrl.title')} error={fieldState.invalid} />
          <FormHelperText error={fieldState.invalid}>
            {fieldState.invalid ? et(fieldState.error?.message ?? 'error.default') : t('tg.botUrl.hint')}
          </FormHelperText>
        </FormControl>
      )} />
      <Controller control={control} name="tg.validators" render={({ field, fieldState }) => (
        <FormControl fullWidth sx={{ mt: 2, mb: 4 }} component="fieldset">
          <FormLabel>{t('tg.validators.label')}</FormLabel>
          <FormGroup>
            {tgValidators.map(
              validator => <FormControlLabel key={`tgValidators-${validator}`} {...field} label={t(`tg.validators.${validator}.label`)}
                control={<Checkbox onChange={onChangeTgValidator(field, validator)} value="true" checked={validators.includes(validator)} />} />
            )}
          </FormGroup>
          <FormHelperText error={fieldState.invalid}>{fieldState.invalid ? fieldState.error?.message : t('tg.validators.hint')}</FormHelperText>
        </FormControl>
      )} />
    </> : undefined}
  </>
}

export interface CredSourceRenderer {
  index: number
  credSource: CensusTypeValues
}
