import { LocalizedError } from '@smartapps-poll/common'
import { type FunctionComponent, type PropsWithChildren, createContext, useContext } from 'react'

export const AuthenticationContext = createContext<AuthenticationContextProps>({
  onSuccess: async () => { throw new LocalizedError('no.success') }
})

export interface AuthenticationContextProps {
  onSuccess: (name: string) => Promise<void>
}

export const AuthenticationContextProivder: FunctionComponent<PropsWithChildren<AuthenticationContextProps>> =
  ({ children, ...props }) => {
    return <AuthenticationContext.Provider value={props}>{children}</AuthenticationContext.Provider>
  }

export const useAuthenticationContext = (): AuthenticationContextProps => {
  return useContext(AuthenticationContext)
}
