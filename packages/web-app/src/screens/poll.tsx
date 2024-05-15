import type { FunctionComponent } from 'react'
import { useParams } from 'react-router-dom'
import { useCtx } from '@smartapps-poll/web-widget/dist/app'
import type { Context } from '@smartapps-poll/web-widget'
import { PollView } from '@smartapps-poll/web-widget'
import { Layout } from '../components/layout'

export const PollScreen: FunctionComponent = () => {
  const ctx = useCtx()
  const { id } = useParams<PollScreenParams>()

  return <Layout path={`poll/${id ?? ''}`}>
    <PollView context={ctx as Context} id={id ?? ''} />
  </Layout>
}

export interface PollScreenParams extends Record<string, string | undefined> {
  id: string
}
