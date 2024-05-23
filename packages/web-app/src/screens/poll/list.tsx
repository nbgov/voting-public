import { PublicPollList } from '@smartapps-poll/web-widget/dist/app'
import { useMemo, type FunctionComponent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../../components/layout'
import { ScreenLoader } from '@smartapps-poll/web-common'

export const PollListScreen: FunctionComponent = () => {
  const navigate = useNavigate()
  const loaderHanlder = useMemo(() => ({}), [])
  return <Layout path="poll_list">
    <ScreenLoader hanlder={loaderHanlder}>
      <PublicPollList open={async id => { navigate(`/poll/${id}`) }} readyHandler={loaderHanlder} />
    </ScreenLoader>
  </Layout>
}
