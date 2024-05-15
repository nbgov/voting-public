import type { Election, PublishedElection } from '@vocdoni/sdk'
import { CensusStatus, type PollInfo, type PollResult } from '../poll'

export const updateVocdoniPoll = (poll: PollInfo, election: Election): PollInfo => ({
  ...poll,
  title: election.title.default,
  description: election.description.default ?? '',
  questions: poll.questions?.length === election.questions.length ? election.questions.map(question => ({
    title: question.title.default,
    description: question.description?.default ?? '',
    choices: question.choices.map(choice => ({
      title: choice.title.default,
      value: choice.value
    }))
  })) : poll.questions
})

export const parseElectionResults = (election: PublishedElection): PollResult => {
  const _result: PollResult = {
    externalId: election.id,
    startDate: new Date(election.startDate),
    endDate: new Date(election.endDate),
    census: {
      externalId: election.census.censusId as string,
      url: election.census.censusURI as string,
      status: election.census.isPublished ? CensusStatus.PUBLISHED : CensusStatus.UNPUBLISHED,
      size: election.census.size as number ?? election.maxCensusSize,
      weight: election.census.weight as bigint,
      type: election.census.type as string
    },
    maxCensusSize: election.maxCensusSize,
    status: election.status,
    voteCount: election.voteCount,
    finished: election.finalResults,
    electionCount: 0, // election.electionCount,
    questions: election.questions.map(question => {
      const total = question.choices.reduce((total, choice) => total + parseInt(choice.results ?? '0'), 0)
      const sorterd = [...question.choices].sort((a, b) => parseInt(a.results ?? '0') - parseInt(b.results ?? '0'))
      let winner = sorterd.pop()
      winner = question.choices.some(choice =>
        parseInt(choice.results ?? '0') === parseInt(winner?.results ?? '')
      )
        ? winner
        : undefined
      return {
        title: question.title.default,
        description: question.title.default,
        choices: question.choices.map(choice => ({
          title: choice.title.default,
          value: choice.value,
          result: choice.results ?? '',
          count: parseInt(choice.results ?? '0'),
          share: parseInt(choice.results ?? '0') / total,
          winner: winner?.value === choice.value && parseInt(choice.results ?? '0') > 0
        }))
      }
    })
  }

  return _result
}
