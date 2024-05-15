import Container from '@mui/material/Container'
import CssBaseline from '@mui/material/CssBaseline'
import Grid from '@mui/material/Grid'
import { buildCommonContext, DebugIntegration, WebContextProvider, useCtx as useContext } from '@smartapps-poll/web-common'
import type { FunctionComponent, PropsWithChildren } from 'react'
import type { Context, Config } from './types'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { type Theme, useTheme } from '@mui/material/styles'
import { type i18n as I18n } from 'i18next'
import { initI18nShared } from '../shared'
import ThemeProvider from '@mui/material/styles/ThemeProvider'
import useMediaQuery from '@mui/material/useMediaQuery'

export const buildContext = (config: Config): Context => {
  const context = buildCommonContext(config) as unknown as Context

  return context
}

export const useCtx = (): Context => useContext()

/**
 * Component App.Widget
 *
 * Simple view context for public applications.
 * Implies that the user mostly interact with the application regardless of his role in the system.
 */
export const Widget: FunctionComponent<PropsWithChildren<WidgetProps>> = ({ config, i18n, children, theme }) => {
  const _theme = useTheme()
  theme = theme ?? _theme
  i18n = i18n ?? initI18nShared({}, config)
  const isSmallUI = useMediaQuery(theme.breakpoints.down('md'))
  return <WebContextProvider i18n={i18n} context={buildContext({ ...config })}>
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <CssBaseline />
        <Container maxWidth={false} disableGutters sx={{
          [theme.breakpoints.down('sm')]: { px: 1 },
          [theme.breakpoints.only('sm')]: { px: '5%' },
          [theme.breakpoints.up('md')]: { px: '10%' },
          height: '100vh'
        }}>
          <Grid container item direction="row" justifyContent="center" alignItems="center" height={isSmallUI ? undefined : '100%'}>{children}</Grid>
        </Container>
      </LocalizationProvider>
    </ThemeProvider>
    {config.debug != null ? <DebugIntegration auth={config.debug.auth} /> : undefined}
  </WebContextProvider>
}

export interface WidgetProps {
  i18n?: I18n
  config: Config
  theme?: Theme
}
