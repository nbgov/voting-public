  import Container from '@mui/material/Container'
import CssBaseline from '@mui/material/CssBaseline'
import Grid from '@mui/material/Grid'
import { checkRole, MemberRole, type IntegrationParams } from '@smartapps-poll/common'
import { buildCommonContext, DebugIntegration, WebContextProvider, useCtx as useContext } from '@smartapps-poll/web-common'
import type { FunctionComponent, PropsWithChildren } from 'react'
import type { Context, Config } from './types'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { type i18n as I18n } from 'i18next'
import { initI18nShared } from './i18n'
import createTheme from '@mui/material/styles/createTheme'
import ThemeProvider from '@mui/material/styles/ThemeProvider'
import useMediaQuery from '@mui/material/useMediaQuery'

export const buildContext = (config: Config): Context => {
  const context = buildCommonContext(config) as unknown as Context

  context.isRoleAuthenticated = role => context.integration != null
    && checkRole(context.integration.role, role ?? config.role ?? MemberRole.MEMBER)
    && context.isAuthenticated()

  return context
}

export const useCtx = (): Context => useContext()

/**
 * Component Shared.Widget
 *
 * This component is used to build role related applications and areas. E.g. management area.
 */
export const Widget: FunctionComponent<PropsWithChildren<WidgetProps>> = ({ role, config, params, i18n, children }) => {
  i18n = i18n ?? initI18nShared({}, config)
  const theme = createTheme({
    typography: {
      h2: { fontSize: '2.5rem', fontWeight: 'bold' },
      h4: { fontSize: '1.75rem' },
      button: { textTransform: 'none' }
    }
  })

  const isSmallUI = useMediaQuery(theme.breakpoints.down('md'))

  return <WebContextProvider i18n={i18n} context={buildContext({ ...config, role })} integration={params}>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Container maxWidth={false} disableGutters sx={{ minHeight: '100vh' }}>
          <Grid container item direction="row" justifyContent="center" alignItems="center" height={isSmallUI ? undefined : '100%'}>{children}</Grid>
        </Container>
      </LocalizationProvider>
    </ThemeProvider>
    {config.debug != null ? <DebugIntegration auth={config.debug.auth} /> : undefined}
  </WebContextProvider>
}

export interface WidgetProps {
  role?: MemberRole
  config: Config
  params?: IntegrationParams
  i18n?: I18n
}
