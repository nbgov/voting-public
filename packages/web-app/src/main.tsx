import { ProofspaceAuthChoiceAsync, setError } from '@smartapps-poll/web-common'
import { Suspense, type FunctionComponent, type FC, useEffect } from 'react'
import { createHashRouter, type ErrorResponse, RouterProvider, useNavigate, useRouteError, createBrowserRouter } from 'react-router-dom'
import { config } from './config'
import { PollScreen } from './screens/poll'
import { ManagerScreen } from './screens/manager'
import { PollListScreen } from './screens/poll/list'
import CircularProgress from '@mui/material/CircularProgress'
import { useTranslation } from 'react-i18next'

export const Main: FunctionComponent = () => {
  return <Suspense fallback={<CircularProgress />}><RouterProvider router={router} /></Suspense>
}

export const ErrorElement: FC = () => {
  const { t } = useTranslation()
  const error = useRouteError() as Record<string, unknown>
  console.error(error)
  useEffect(() => {
    if ('status' in error) {
      const _err = error as ErrorResponse
      setError(t, _err.status, _err.statusText)
    } else {
      setError(t, 500)
    }
  }, [error])
  return <>{t('error.unknown')}</>
}

const routes = [
  {
    path: '/auth',
    Component: () => {
      const navigate = useNavigate()
      return <ProofspaceAuthChoiceAsync onSuccess={async () => { navigate('/') }} />
    }
  },
  {
    path: '/',
    Component: () => {
      return <PollListScreen />
    },
    errorElement: <ErrorElement />
  },
  {
    path: '/poll',
    children: [
      {
        path: ':id',
        Component: () => {
          return <PollScreen />
        }
      }
    ]
  },
  {
    path: '/manager',
    element: <ManagerScreen />
  }
]
const router = document.location.host.endsWith('googleapis.com')
  ? createHashRouter(routes, { basename: config.baseUrl })
  : createBrowserRouter(routes, { basename: config.baseUrl })
