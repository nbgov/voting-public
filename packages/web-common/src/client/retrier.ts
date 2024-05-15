import type { AxiosInstance } from 'axios'
import retry from 'axios-retry'

export const applyRetrier = (axios: AxiosInstance) => {
  retry(axios, { retries: 50, retryDelay: () => 3000 })
}
