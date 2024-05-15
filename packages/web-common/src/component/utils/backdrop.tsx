import type { FunctionComponent, PropsWithChildren } from 'react'
import Loading from '@mui/material/Backdrop'
import type { Toggleable } from './types'
import CircularProgress from '@mui/material/CircularProgress'

export const Backdrop: FunctionComponent<PropsWithChildren<BackdropProps>> = ({ toggle, children }) => {
  return <Loading sx={{ zIndex: 5000 }} open={toggle.opened} onClick={() => { }}>
    {children ?? <CircularProgress color="inherit" />}
  </Loading>
}

export interface BackdropProps {
  toggle: Toggleable
}
