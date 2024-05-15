import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardActions from '@mui/material/CardActions'
import CardContent from '@mui/material/CardContent'
import Link from '@mui/material/Link'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import { type PollInfo, type PsActionTemplate } from '@smartapps-poll/common'
import { type FunctionComponent } from 'react'
import { useTranslation } from 'react-i18next'

export const HowToGetAuthorization: FunctionComponent<HowToGetAuthorizationProps> = ({
  poll, next
}) => {
  const { t } = useTranslation(undefined, { keyPrefix: 'common.authorization.howto' })
  const proof = Array.isArray(poll.requiredProofs) ? poll.requiredProofs.find(proof => !proof.isMandatory) : undefined
  const action = proof != null ? proof.meta as PsActionTemplate : undefined

  return <Paper>
    <Card>
      <CardContent>
        <Typography variant="h4">{t('title')}</Typography>
        <Typography variant="body2">{t('subheader')}</Typography>
        {action == null
          ? undefined
          : <>
            <Typography variant="h5">{action?.actionName}</Typography>
            <Typography variant="body1">{action?.description}</Typography>
          </>}
        {proof == null
          ? undefined
          : <Link href={proof.guideUrl} target="_blank">{t('actions.more')}</Link>}
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end', px: 2 }}>
        <Button fullWidth variant="contained" onClick={() => { void next() }}>{t('actions.next')}</Button>
      </CardActions>
    </Card>
  </Paper>
}

export interface HowToGetAuthorizationProps {
  poll: PollInfo
  next: () => Promise<void>
}
