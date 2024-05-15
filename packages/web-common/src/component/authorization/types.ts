import type { PollInfo } from '@smartapps-poll/common'

export interface ConditionInfoProps {
  poll: PollInfo | undefined
  back?: () => void
  noBorder?: boolean
}
