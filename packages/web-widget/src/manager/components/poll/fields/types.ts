import type { ChoiceMeta } from '@smartapps-poll/common';
import type { PollChoiceProps } from '../types'

export interface MemberAvaterProps<Meta extends ChoiceMeta = ChoiceMeta> extends Omit<PollChoiceProps<Meta>, "field" | "remove"> {

}
