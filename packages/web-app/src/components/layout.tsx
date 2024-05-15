import AppBar from '@mui/material/AppBar'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Toolbar from '@mui/material/Toolbar'
import Logo from '../assets/nb_new_logo.png'
import { type FC } from 'react'
import { PollLogo } from '@smartapps-poll/web-common'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import useTheme from '@mui/material/styles/useTheme'
import { useNavigate } from 'react-router-dom'
import { useAppContextStrategyUpdate, useViewWithWrappedLayout } from './utils'
import type { LayoutProps } from './types'

export const Layout: FC<LayoutProps> = ({ children, path }) => {
  useAppContextStrategyUpdate(path)
  const shouldHideWrapper = useViewWithWrappedLayout()
  const { t } = useTranslation(undefined, { keyPrefix: 'webApp.layout' })
  const navigate = useNavigate()
  const theme = useTheme()

  return <Box sx={{ flexGrow: 1 }}>
    {shouldHideWrapper
      ? undefined
      : <>
        <AppBar position="fixed">
          <Toolbar>
            <Avatar src={Logo} sx={{ width: 50, height: 50, mr: 1, cursor: 'pointer', pointerEvents: 'auto' }}
              onClick={() => { navigate('/') }} />
            <Avatar variant="square" sx={{
              width: 50, height: 50, mr: 1, bgcolor: 'primary.main', cursor: 'pointer', pointerEvents: 'auto'
            }} onClick={() => { navigate('/') }} >
              <PollLogo width={50} height={50} />
            </Avatar>
            <Typography variant="h5" sx={{ flexGrow: 1 }}>{t('header.title')}</Typography>
          </Toolbar>
        </AppBar>
        <Box sx={theme.mixins.toolbar} />
      </>}
    <Box mt={1}>{children}</Box>
  </Box>
}
