import { useMemo, useState } from 'react'
import type { NavigationState, UseNavigationParams, ViewState, ViewStateParams } from './types'
import { DEFNAV } from './consts'

export const useNavigation = <D extends ViewStateParams = ViewStateParams>(params?: UseNavigationParams<D>): NavigationState<D> => {
  const [viewStack, setViewStack] = useState<Array<ViewState<D>>>(params?.defaultState != null ? [params.defaultState] : [{ screen: DEFNAV }])
  const navState = useMemo<NavigationState<D>>(() => {
    // console.info('View stack: ', viewStack)

    const _castView = <T extends D = D>(view: ViewState<T> | string): ViewState<T> => {
      if (typeof view === 'string') {
        return { screen: view }
      }

      return view
    }

    const _state: NavigationState<D> = {
      viewStack,

      current: <T extends D = D>() => _state.viewStack[0] as ViewState<T>,

      go: <N extends D = D, P extends D = D>(view: ViewState<N> | string): ViewState<P> | undefined => {
        view = _castView(view)
        let prev: ViewState<P> | undefined
        // console.log('Before', _state.viewStack[0].screen)
        if (_state.viewStack.length > 0) {
          prev = _state.viewStack.shift() as ViewState<P>
        }
        _state.viewStack.unshift(view)

        setViewStack([..._state.viewStack])
        // console.log('After', _state.viewStack[0].screen)

        return prev
      },

      add: <N extends D = D, P extends D = D>(view: ViewState<N> | string): ViewState<P> | undefined => {
        view = _castView(view)
        let prev: ViewState<P> | undefined
        if (_state.viewStack.length > 0) {
          prev = _state.viewStack[0] as ViewState<P>
        }
        _state.viewStack.unshift(view)

        setViewStack([..._state.viewStack])

        return prev
      },

      back: <P extends D = D>(): ViewState<P> | undefined => {
        let prev: ViewState<P> | undefined
        if (_state.viewStack.length > 1) {
          prev = _state.viewStack.shift() as ViewState<P>
          // console.log('go back:', _state.viewStack)
        }

        setViewStack([..._state.viewStack])

        return prev
      },

      restart: <T extends D = D>(view: ViewState<T> | string): void => {
        view = _castView(view)
        _state.viewStack = [view]

        setViewStack([..._state.viewStack])
      }
    }

    return _state
  }, [params, params?.defaultState])

  return navState
}
