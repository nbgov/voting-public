import Card from '@mui/material/Card'
import type { FC } from 'react'
import { useCtx } from '../context'
import { isDesktop } from '../helpers'
import { useTranslation } from 'react-i18next'

import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'

export const DesktopAlert: FC = () => {
  const ctx = useCtx()
  const {t} = useTranslation(undefined, {keyPrefix: 'shared.poll.vote.alert'})
  return isDesktop(ctx) ? <Card sx={{ mb: 2, borderColor: "primary" }}>
    <CardHeader title={t('title')} titleTypographyProps={{ variant: "h5", color: "primary" }} sx={{ pb: 0, mb: 0 }} />
    <CardContent sx={{ pt: 1, mt: 0 }}>
      <Typography>{t('intro')} <Link href="https://bit.ly/rada2024" target="_blank">bit.ly/rada2024</Link></Typography>
      <ol>
        <li><Typography>{t('point-0')}</Typography></li>
        <li><Typography>{t('point-1')}</Typography></li>
        <li><Typography color="primary"><b>{t('point-2')}</b></Typography></li>
      </ol>
      {/* <Typography variant="caption">{t('warning')}</Typography> */}
    </CardContent>
  </Card> : <></>
}
