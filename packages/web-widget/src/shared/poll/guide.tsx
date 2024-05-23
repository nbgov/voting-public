import { type FC } from 'react'
import { useTranslation } from 'react-i18next'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import ContactSupportIcon from '@mui/icons-material/ContactSupport'
import { type ConditionInfoProps } from '@smartapps-poll/web-common'
import Box from '@mui/material/Box'

export const Guide: FC<ConditionInfoProps> = ({ poll, noBorder }) => {
  const { t } = useTranslation(undefined, { keyPrefix: 'condition.info' })

  const open = (url?: string) => () => window.open(url, '_blank')
  noBorder = noBorder != null && noBorder
  const guideUrl = poll?.requiredProofs?.find(proof => proof.guideUrl != null)?.guideUrl
  return <Box mt={2}>
    <Typography>{t('guide')}</Typography>
    <Button onClick={open(guideUrl)} variant="text"
      startIcon={<ContactSupportIcon />}>{t('guideUrl')}</Button>
  </Box>
}
