
export interface VeriffAPIResult {

}

export interface VeriffNewSession extends VeriffAPIResult {
  status: string
  verification: {
    id: string
    url: string
    vendorData: string
    host: string
    status: string
    sessionToken: string
  }
}

export type VeriffHookRequest = VeriffHookAction | VeriffHookDecision

export interface VeriffHookDecision {
  status: VeriffStatus
  verification: {
    id: string
    code: number
    reason?: string
    reasonCode: number
    status: VeiffDocStatus
    vendorData: string
    person: {
      idNumber?: string
      dateOfBirth: string
    }
    document: {
      validUntil: string
      country: string
      type: string
    }
  }
  technicalData: {
    ip: string
  }
}

export interface PollVerification {
  seed: string
  id: string
}

export interface VeriffHookAction {
  id: string
  attemptId: string
  feature: string
  code: number
  action: VeriffActions
  vendorData: string
}

export enum VeiffDocStatus {
  Approved = 'approved'
}

export enum VeriffStatus {
  Success = 'success'
}

export enum VeriffActions {
  Started = 'started',
  Submitted = 'submitted'
}

export interface VeriffService {
  deleteSession: (id: string) => Promise<boolean> 
  createSession: (customData: string) => Promise<VeriffNewSession>
}
