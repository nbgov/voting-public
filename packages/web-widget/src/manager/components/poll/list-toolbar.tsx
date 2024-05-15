import { type FunctionComponent } from 'react'
import IconButton from '@mui/material/IconButton'
import Toolbar from '@mui/material/Toolbar'
import PostAddIcon from '@mui/icons-material/PostAdd'
import Typography from '@mui/material/Typography'
import { useNavigator } from '@smartapps-poll/web-common'
import { screenPollCreation } from '../../consts'
import { useTranslation } from 'react-i18next'

export const PollListToolbar: FunctionComponent = () => {
  const { t } = useTranslation(undefined, { keyPrefix: 'manager.poll.list.toolbox' })
  const nav = useNavigator()
  return <Toolbar>
    <Typography variant="h5" noWrap sx={{ flexGrow: 1 }}>{t('title')}</Typography>
    <IconButton edge="end" size="large" onClick={() => { nav.add(screenPollCreation()) }}>
      <PostAddIcon />
    </IconButton>
  </Toolbar>
}
