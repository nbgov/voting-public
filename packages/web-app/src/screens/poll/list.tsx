import { PublicPollList } from '@smartapps-poll/web-widget/dist/app'
import type { FunctionComponent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../../components/layout'

export const PollListScreen: FunctionComponent = () => {
  const navigate = useNavigate()
  return <Layout path="poll_list">
    <PublicPollList open={async id => { navigate(`/poll/${id}`) }} />
  </Layout>
}
