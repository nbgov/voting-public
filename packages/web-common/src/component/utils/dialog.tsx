import Modal, { type DialogProps as ModalProps } from '@mui/material/Dialog'
import type { FunctionComponent, PropsWithChildren } from 'react'
import type { Toggleable } from './types'

export const Dialog: FunctionComponent<PropsWithChildren<DialogProps>> = ({ toggle, children, ...props }) => {
  return <Modal open={toggle.opened} onClose={props.mandatory === undefined ? undefined : toggle.close}
    maxWidth={props.maxWidth ?? 'md'} sx={{ zIndex: 2500 }}>{children}</Modal>
}

export interface DialogProps {
  toggle: Toggleable
  maxWidth?: ModalProps['maxWidth']
  mandatory?: boolean
}
