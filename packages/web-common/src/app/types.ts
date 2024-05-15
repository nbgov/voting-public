
export interface NavigationState<DefT extends ViewStateParams = ViewStateParams> {
  viewStack: Array<ViewState<DefT>>
  current: <T extends DefT = DefT>() => ViewState<T>
  go: <N extends DefT = DefT, P extends DefT = DefT>(view: ViewState<N> | string) => ViewState<P> | undefined
  add: <N extends DefT = DefT, P extends DefT = DefT>(view: ViewState<N> | string) => ViewState<P> | undefined
  back: <P extends DefT = DefT>() => ViewState<P> | undefined
  restart: <T extends DefT = DefT>(view: ViewState<T> | string) => void
}

export interface UseNavigationParams<D extends ViewStateParams = ViewStateParams> {
  defaultState?: ViewState<D>
}

export interface ViewState<T extends ViewStateParams = ViewStateParams> {
  screen: string
  params?: T
}

export interface ViewStateParams extends Record<string, unknown> { }
