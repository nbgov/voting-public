import { MemberRole } from '@smartapps-poll/common'
import { ProofspaceIntegratedAuthAsync, useNavigation, Navigator, Screen, useCtx } from '@smartapps-poll/web-common'
import { type FunctionComponent } from 'react'
import { type Context, Widget, initI18nShared, type WidgetProps } from '../shared'
import { Main } from './main'
import Box from '@mui/material/Box'
import { belarusManagerTranslation, englishManagerTranslation, russianManagerTranslation } from '../i18n'

export const ManagerWidget: FunctionComponent<WidgetProps> = ({ config, params, i18n }) => {
  i18n = i18n ?? initI18nShared({
    resources: {
      en: { translation: englishManagerTranslation },
      be: { translation: belarusManagerTranslation },
      ru: { translation: russianManagerTranslation }
    }
  }, config)

  return <Widget role={MemberRole.MANAGER} config={config} params={params} i18n={i18n}>
    <WidgetBody />
  </Widget>
}

export const WidgetBody: FunctionComponent = () => {
  const ctx = useCtx<Context>()
  const nav = useNavigation()

  const isAuthenticated = ctx.isRoleAuthenticated(MemberRole.MANAGER)

  return <Box sx={{ width: '90%' }}><Navigator navigation={nav}>
    <Screen match={_ => !isAuthenticated}>
      <ProofspaceIntegratedAuthAsync onSuccess={async () => {
        ctx.isRoleAuthenticated(MemberRole.MANAGER) ? nav.go('loggedIn') : alert('Widget / role missmatch!')
      }} />
    </Screen>
    <Screen match={_ => isAuthenticated}>
      <Main />
    </Screen>
  </Navigator>
  </Box>
}
