import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import { type FunctionComponent, type MouseEvent, type PropsWithChildren } from 'react'
import { type Toggleable } from './types'

export const ProgressButton: FunctionComponent<PropsWithChildren<ProgressButtonProps>> = ({
  size, toggle, onClick, disabled, variant, fullWidth, children
}) => {
  const progressSize = size === 'large'
    ? 20
    : size === 'medium'
      ? 16
      : 14

  return <Button variant={variant ?? 'contained'} size={size ?? 'large'} onClick={event => { void onClick(event) }}
    disabled={!toggle.opened || (disabled != null ? disabled : false)}
    fullWidth={fullWidth ?? undefined}
    endIcon={toggle.opened ? undefined : <CircularProgress size={progressSize} />}>
    {children}
  </Button>
}

export interface ProgressButtonProps {
  size?: 'small' | 'medium' | 'large'
  variant?: 'contained' | 'outlined'
  disabled?: boolean
  toggle: Toggleable
  fullWidth?: boolean
  onClick: (event?: MouseEvent) => Promise<void>
}
