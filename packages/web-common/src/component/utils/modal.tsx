import Dialog from '@mui/material/Dialog'
import { FC, useCallback } from 'react'
import { useModalManager } from '../../model/modal'

export const MainModal: FC = () => {
  const modal = useModalManager()

  const handleClose = useCallback((value: unknown) => {
    modal.close()
    modal.respond(value)
  }, [])

  const Com = modal.Component ?? (() => <></>)

  return <Dialog open={modal.opened}> {/* onClose={() => handleClose(undefined)}>*/}
    <Com callback={handleClose} />
  </Dialog>
}
