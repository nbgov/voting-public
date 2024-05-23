import type { FunctionComponent } from 'react'
import { useParams } from 'react-router-dom'
import { useCtx } from '@smartapps-poll/web-widget/dist/app'
import type { Context } from '@smartapps-poll/web-widget'
import { PollView } from '@smartapps-poll/web-widget'
import { Layout } from '../components/layout'
import { ScreenLoader } from '@smartapps-poll/web-common'

export const PollScreen: FunctionComponent = () => {
  const ctx = useCtx()
  const { id } = useParams<PollScreenParams>()

  const loaderHanlder = {}
  return <Layout path={`poll/${id ?? ''}`}>
    <ScreenLoader hanlder={loaderHanlder}>
      <PollView context={ctx as Context} id={id ?? ''} readyHandler={loaderHanlder} />
    </ScreenLoader>
  </Layout>
}

export interface PollScreenParams extends Record<string, string | undefined> {
  id: string
}
