import { type FC } from 'react'
import { useController, useFormContext } from 'react-hook-form'
import { type PollCreationForm } from '../poll/types'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import { dockNBPrefedinedActions } from '@smartapps-poll/common'
import { useTranslation } from 'react-i18next'

export const NewBelarusFilter: FC<DockFilterProps> = ({ index }) => {
  const { control, register } = useFormContext<PollCreationForm>()
  const { t } = useTranslation(undefined, { keyPrefix: 'manager.census.filter' })

  const controller = useController({ control, name: `requiredProofs.${index}`, defaultValue: '' })

  return <Select labelId="census-filter-select-label" {...register(`requiredProofs.${index}`)} value={controller.field.value ?? ''}
    id="census-filter-select" label={t('select.title')}>
    {dockNBPrefedinedActions.map(action =>
      <MenuItem key={action.actionId} value={action.actionId}
        selected={action.actionId === controller.field.value}
      >{action.title}</MenuItem>
    )}
  </Select>
}

export interface DockFilterProps {
  index: number
}
