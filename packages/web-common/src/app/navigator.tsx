import type { ReactElement, PropsWithChildren, FunctionComponent } from 'react'
import { createContext, useContext } from 'react'
import type { NavigationState, ViewState, ViewStateParams } from './types'
import { WILDNAV } from './consts'

export const NavigaorContext = createContext<NavigationState>({} as any)

export const Navigator: FunctionComponent<NavigatorProps> = (props) => {
  return <NavigaorContext.Provider value={props.navigation}>
    {props.children}
  </NavigaorContext.Provider>
}

export const Screen: FunctionComponent<PropsWithChildren<ScreenProps>> = ({ screen, match, render, children }) => {
  const navigation = useNavigator()
  const current = navigation.current()
  if (screen === undefined || screen === current.screen || screen === WILDNAV) {
    if (match === undefined || match(current)) {
      if (render != null) {
        return render(current)
      } else if (children != null) {
        return <>{children}</>
      }
    }
  }

  return <></>
}

export const useNavigator = (): NavigationState => useContext(NavigaorContext)

export interface NavigatorProps extends PropsWithChildren {
  navigation: NavigationState
}

export interface ScreenProps {
  screen?: string
  render?: <V extends ViewState<any>>(view: V) => ReactElement
  match?: ScreenMatcher
}

export type ScreenMatcher = <T extends ViewStateParams = ViewStateParams>(view: ViewState<T>) => boolean
