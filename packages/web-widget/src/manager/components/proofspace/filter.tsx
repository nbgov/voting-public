import { type PsActionTemplate, EMPTY_ACTION } from '@smartapps-poll/common'
import { type FunctionComponent, useState, useEffect } from 'react'
import { useCtx } from '../../../shared'
import Select from '@mui/material/Select'
import { Controller, useFormContext } from 'react-hook-form'
import { type PollCreationForm } from '../poll/types'
import MenuItem from '@mui/material/MenuItem'
import { useTranslation } from 'react-i18next'

export const ProofspaceFilter: FunctionComponent<ProofspaceFilterProps> = ({ index }) => {
  const ctx = useCtx()
  const { t } = useTranslation(undefined, { keyPrefix: 'manager.census.filter' })
  const [actions, setActions] = useState<PsActionTemplate[]>([])

  const { control, watch } = useFormContext<PollCreationForm>()
  const census = watch('census')

  useEffect(() => {
    void (async () => {
      const actions: PsActionTemplate[] = await ctx.strategy.creds().getRequiredProofList(census.type) as PsActionTemplate[]
      if (actions != null && actions.length > 0) {
        setActions(actions)
      }
    })()
  }, [census.type])

  return actions.length > 0 ? <Controller control={control} name={`requiredProofs.${index}`} defaultValue=""
    render={({ field }) => (
      <Select labelId="census-filter-select-label" {...field}
        value={field.value ?? EMPTY_ACTION} id="census-filter-select" label={t('select.title')}>
        <MenuItem value={EMPTY_ACTION}>{t('select.empty')}</MenuItem>
        {actions.map(action =>
          <MenuItem key={action.actionId} value={action.actionId}>{action.actionName}</MenuItem>
        )}
      </Select>)} /> : null
}

export interface ProofspaceFilterProps {
  index: number
}
