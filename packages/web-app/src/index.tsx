import './shim'
import ReactDOMClient from 'react-dom/client'
import { Widget } from '@smartapps-poll/web-widget/dist/app'
import { config } from './config'
import { Main } from './main'
import { initI18nShared } from '@smartapps-poll/web-widget'
import { patchI18n } from '@smartapps-poll/web-common'
import enLocale from './i18n/en.json'
import ruLocale from './i18n/ru.json'
import beLocale from './i18n/be.json'
import { I18nextProvider } from 'react-i18next'
import ThemeProvider from '@mui/material/styles/ThemeProvider'
import createTheme from '@mui/material/styles/createTheme'
import React, { type FC } from 'react'
const CryptoLoader: FC = React.lazy(() => import('./crypto-loader') as any)

const i18n = initI18nShared({}, config)
patchI18n(i18n, {
  en: { translation: enLocale },
  ru: { translation: ruLocale },
  be: { translation: beLocale }
})

const theme = createTheme({
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"'
    ].join(','),
    fontWeightRegular: 400,
    h2: { fontSize: '2.5rem', fontWeight: 'bold' },
    h4: { fontSize: '1.75rem' },
    button: { textTransform: 'none' }
  },
  palette: {
    primary: {
      main: '#e24820',
      light: '#f0a490',
      dark: '#D9382C',
      contrastText: '#fff'
    }
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          border: '1px solid rgba(0, 0, 0, 0.12)'
        }
      }
    },
    MuiCssBaseline: {
      styleOverrides: (theme) => ({
        body: {
          [theme.breakpoints.down('sm')]: {
            backgroundColor: theme.palette.grey['100']
          }
        }
      })
    }
  }
})

ReactDOMClient.createRoot(document.getElementById('root') as HTMLElement)
  .render(<ThemeProvider theme={theme}>
    <Widget config={config} i18n={i18n} theme={theme}>
      <I18nextProvider i18n={i18n}><Main /></I18nextProvider>
    </Widget>
    <CryptoLoader />
  </ThemeProvider>)
