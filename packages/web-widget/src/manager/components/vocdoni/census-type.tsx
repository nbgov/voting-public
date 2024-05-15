import { type FunctionComponent, useEffect, useState } from 'react'
import { useCtx } from '../../../shared'
import { useTranslation } from 'react-i18next'
import { Controller, useFormContext } from 'react-hook-form'
import { type PollCreationForm } from '../poll/types'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import { SKIP_CRED_SOURCE, VOCDONI_CENSUS_OFFCHAIN, supportedCensusBySource } from '@smartapps-poll/common'

export const VocdoniCensusTypeSelect: FunctionComponent = () => {
  const ctx = useCtx()
  const { t } = useTranslation(undefined, { keyPrefix: 'manager.census.filter' })

  const { control, watch } = useFormContext<PollCreationForm>()
  const [types, setTypes] = useState<string[]>([])
  const credSources = watch('credSources')

  useEffect(() => {
    (async () => {
      const types = (await ctx.strategy.service().census.getSupportedTypes())
        .filter(type => credSources.every(
          credSource => credSource === SKIP_CRED_SOURCE
            || supportedCensusBySource[credSource].includes(type)
        ))

      setTypes(types)
    })()
  }, credSources)

  return types.length > 0 ? <Controller control={control} name="census.type" defaultValue=""
    render={({ field }) => (
      <Select labelId="census-type-select-label" {...field} value={field.value ?? ''}
        id="census-filter-select" label={t('type.title')}>
        {types.map(type =>
          <MenuItem key={type} value={type} defaultChecked={type === VOCDONI_CENSUS_OFFCHAIN} selected={type === field.value}>
            {t(`type.value.${type}`)}
          </MenuItem>
        )}
      </Select>)} /> : null
}
