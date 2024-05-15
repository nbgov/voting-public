import { type FunctionComponent } from 'react'
import { useCtx } from '../../../shared'
import Button from '@mui/material/Button'
import copy from 'copy-to-clipboard'
import { type Poll } from '@smartapps-poll/common'
import { useTranslation } from 'react-i18next'

export const PollShareBlock: FunctionComponent<PollShareBlockProps> = ({ poll }) => {
  const { t } = useTranslation(undefined, { keyPrefix: 'manager.poll.sharedActions' })
  const ctx = useCtx()

  const cfg = ctx.getApiConfiguration()
  const url = (cfg.baseUrl ?? ctx.config.sharableBaseUrl ?? '') + `/poll/${poll._id}`
  return ctx.config.sharableBaseUrl == null
    ? <></>
    : <>
      <Button variant="outlined" size="large" onClick={() => { window.open(url, '_blank') }}>{t('preview')}</Button>
      <Button variant="outlined" size="large" onClick={() => { copy(url) }}>{t('copy')}</Button>
    </>
}

export interface PollShareBlockProps {
  poll: Poll
}
