import type { FC } from 'react'
import type { ModalBodyProps } from '../utils/types'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import { useTranslation } from 'react-i18next'
import Button from '@mui/material/Button'
import { TGPIN_BACK } from './consts'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Link from '@mui/material/Link'
import { TELEGRAM_STRATEGY, type PollInfo, type TelegramRequiredProof } from '@smartapps-poll/common'

export const makeTelegramBlocker = (poll: PollInfo): FC<ModalBodyProps> => ({ callback }) => {
  const { t } = useTranslation(undefined, { keyPrefix: 'common.authorization.tg-blocker' })
  const tgProof = poll.requiredProofs?.find(
    proof => proof.type === TELEGRAM_STRATEGY && proof.isMandatory
  ) as TelegramRequiredProof | undefined

  return <>
    <DialogContent>
      <Card>
        <CardHeader title={t('header')} />
        <CardContent>
          <Typography variant="body2">{t('why.main')}</Typography>
          <ul>
            <li><Typography variant="body2">{t('why.primary')}</Typography></li>
            {tgProof?.meta?.botUrl ? <li>
              <Typography variant="body2">{t('why.secondary')}</Typography>
              <Link href={tgProof.meta.botUrl} variant="body1">{tgProof.meta.botUrl}</Link>
            </li> : undefined}
          </ul>
        </CardContent>
      </Card>
    </DialogContent>
    <DialogActions>
      <Button variant="contained" onClick={() => callback(TGPIN_BACK)}>{t('action.back')}</Button>
    </DialogActions>
  </>
}
