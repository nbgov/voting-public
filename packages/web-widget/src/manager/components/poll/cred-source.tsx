import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import { type FC } from 'react'
import { useFormContext, Controller } from 'react-hook-form'
import { type PollCreationForm } from './types'
import { useTranslation } from 'react-i18next'
import { DEFAULT_CRED_SOURCE, SKIP_CRED_SOURCE, credentialSourceList } from '@smartapps-poll/common'

export const AuthCredentialSourceSelect: FC<CredSourceSelectProps> = ({ index }) => {
  const { t } = useTranslation(undefined, { keyPrefix: 'manager.census.filter' })
  const { control, trigger, watch } = useFormContext<PollCreationForm>()
  const credSources = watch('credSources')

  return <Controller control={control} name={`credSources.${index}`} defaultValue={SKIP_CRED_SOURCE}
    render={({ field }) => (
      <Select labelId="cred-source-select-label" {...field}
        value={field.value ?? SKIP_CRED_SOURCE} id="census-filter-select" label={t('source.title')}
        onChange={(...vals) => {
          field.onChange(...vals)
          trigger()
        }}>
        {credentialSourceList.map(type => {
          const idx = credSources.findIndex(value => value === type)
          if (idx > -1 && idx !== index && type !== SKIP_CRED_SOURCE) {
            return undefined
          }

          return <MenuItem key={type} value={type} defaultChecked={DEFAULT_CRED_SOURCE === type}>{t(`source.value.${type}`)}</MenuItem>
        })}
      </Select>)} />
}

export interface CredSourceSelectProps {
  index: number
}
