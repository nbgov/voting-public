
export interface User {
  _id: string
  name: string
  active: boolean
  createdAt: Date
  votingAddress: string
  system?: boolean
}
