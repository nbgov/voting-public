import { type FC } from 'react'
import type { ConditionInfoProps } from './types'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import { useTranslation } from 'react-i18next'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { NEWBELARUS_STRATEGY, PROOFSPACE_STRATEGY, TELEGRAM_STRATEGY, WEBPASS_STRATEGY } from '@smartapps-poll/common'
import type { RequiredProof, TgProofMeta } from '@smartapps-poll/common'
import CardHeader from '@mui/material/CardHeader'
import { useCtx } from '../../context'
import { Box } from '@mui/material'
import AppleIcon from '@mui/icons-material/Apple'
import AndroidIcon from '@mui/icons-material/Android'
import TelegramIcon from '@mui/icons-material/Telegram'
import ContactSupportIcon from '@mui/icons-material/ContactSupport'

export const ConditionInfo: FC<ConditionInfoProps> = ({ poll, back, noBorder }) => {
  const ctx = useCtx()
  const { t } = useTranslation(undefined, { keyPrefix: 'condition.info' })

  const open = (url?: string) => () => window.open(url, '_blank')

  const guideUrl = poll?.requiredProofs?.find(proof => proof.guideUrl != null)?.guideUrl
  return <Card style={noBorder != null && noBorder ? { border: "none", boxShadow: "none" } : {}}>
    <CardHeader title={t('title')} />
    <CardContent>
      <Typography>{t('guide')}</Typography>
      <Button onClick={open(guideUrl)} variant="contained" startIcon={<ContactSupportIcon />}>{t('guideUrl')}</Button>
      {
        poll?.requiredProofs?.map(proof => {
          if (ctx.config.hideProofspace && proof.type === PROOFSPACE_STRATEGY) {
            return
          }
          if (ctx.config.hideTg && proof.type === TELEGRAM_STRATEGY) {
            return
          }
          if (ctx.config.hideWebPass && proof.type === WEBPASS_STRATEGY) {
            return
          }
          if (proof.type === NEWBELARUS_STRATEGY) {
            return
          }

          return <Box key={proof.type} mt={2}>
            <Typography variant="h5">{t(`${proof.type}.title`)}</Typography>
            {(() => {
              switch (proof.type) {
                case PROOFSPACE_STRATEGY:
                  return <>
                    <Typography>{t('proofspace.download')}</Typography>
                    <Button onClick={open('https://play.google.com/store/apps/details?id=io.zaka.app')}
                      variant="contained" startIcon={<AndroidIcon />} sx={{ mt: 1 }}>{t('proofspace.android')}</Button>
                    <Button onClick={open('https://apps.apple.com/app/id1512258409')}
                      variant="contained" startIcon={<AppleIcon />} sx={{ ml: 2, mt: 1 }}>{t('proofspace.ios')}</Button>
                  </>
                case NEWBELARUS_STRATEGY:
                  return <>
                    <Typography>{t('newbelarus.download')}</Typography>
                    <Button onClick={open('')}
                      variant="contained" startIcon={<AndroidIcon />} sx={{ mt: 1 }}>{t('newbelarus.android')}</Button>
                    <Button onClick={open('')}
                      variant="contained" startIcon={<AppleIcon />} sx={{ ml: 2, mt: 1 }}>{t('newbelarus.ios')}</Button>
                  </>
                case TELEGRAM_STRATEGY:
                  const _proof: RequiredProof<TgProofMeta> = proof as RequiredProof<TgProofMeta>
                  return <>
                    <Typography>{t('telegram.info')}</Typography>
                    <Button startIcon={<TelegramIcon />} onClick={open(_proof.meta?.botUrl)}
                      variant="contained" sx={{ mt: 1 }}>{t('telegram.bot')}</Button>
                  </>
                case WEBPASS_STRATEGY:
                  return <>
                    <Typography>{t('webpass.info')}</Typography>
                  </>
              }
            })()}
          </Box>
        })
      }
    </CardContent>
    {back != null
      ? <CardActions sx={{ justifyContent: 'flex-end', px: 2 }}>
        <Button fullWidth variant="contained" onClick={() => { void back() }}>{t('actions.back')}</Button>
      </CardActions> : undefined}
  </Card>
}
