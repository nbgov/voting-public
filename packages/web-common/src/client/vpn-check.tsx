import { FC, useState } from 'react'
import { ModalBodyProps, ProgressButton, useToggle } from '../component'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Card from '@mui/material/Card'
import { useCtx } from '../context'
import { shouldSkipGeo } from './fireproxy/geo-skip'
import { useTranslation } from 'react-i18next'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import useTheme from '@mui/material/styles/useTheme'

export const makeVpnBlocker = (): FC<ModalBodyProps> => ({ callback }) => {
  const ctx = useCtx()
  const { t } = useTranslation(undefined, { keyPrefix: 'common.vpn' })
  const toggle = useToggle(true)
  const [counter, setCounter] = useState(5)
  const checkVpn = async () => {
    toggle.close()
    const skipGeo = await shouldSkipGeo(ctx, true)
    toggle.open()
    if (skipGeo) {
      callback('ok')
    } else if (ctx.config.vpnCounter && counter <= 1) {
      callback('unsafe')
    } else {
      setCounter(counter - 1)
    }
  }
  const theme = useTheme()
  return <>
    <DialogContent>
      <Card sx={counter === 5 ? {} : { borderColor: theme.palette.primary.main }}>
        <CardHeader title={t('header')} />
        <CardContent>
          <Typography variant="body2">{t('intro')}</Typography>
          <Typography variant="body2">{t('consent')}</Typography>
          {ctx.config.vpnCounter ? <Typography variant="body2"
          sx={counter === 5 ? {} : { color: theme.palette.primary.main }}>{t('skip')}</Typography> : undefined}
        </CardContent>
      </Card>
    </DialogContent>
    <DialogActions>
      <ProgressButton toggle={toggle} fullWidth onClick={checkVpn}>{t(toggle.opened ? 'try' : 'check')} {
        ctx.config.vpnCounter ? <>({counter})</> : undefined
      }</ProgressButton>
    </DialogActions>
  </>
}
