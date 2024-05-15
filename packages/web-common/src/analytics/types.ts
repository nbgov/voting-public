
export interface AnalyticsHelper {
  logScreen: (screen: string) => void

  log: (event: string, params: Record<string, string>) => void

  startVote: (poll: string, strategy: string, style: string) => void

  finishVote: (poll: string, strategy: string, style: string, success?: boolean) => void

  setupUser: (params: AnalyticsUserParams) => void
}

export interface AnalyticsUserParams {
  webView: boolean
  domain: string
}
