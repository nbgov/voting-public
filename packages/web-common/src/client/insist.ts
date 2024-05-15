import { useEffect, useMemo } from 'react'
import type { DependencyList } from 'react'
import type { Insist, InsistCallback } from './types'

export const createInsist = <T = unknown>(callback?: InsistCallback<T>, proceed?: boolean): Insist<T> => {
  if (proceed === undefined) {
    proceed = true
  }

  const _insist: Insist<T> = {
    proceed,
    callback,
    stoped: false,
    revive: () => {
      _insist.stoped = false
      _insist.proceed = proceed as boolean
    },
    stop: () => {
      console.info('Stop proceed')
      _insist.stoped = true
    },
    exit: () => {
      console.info('Exit proceed')
      _insist.stop()
      _insist.cancel()
    },
    cancel: () => {
      console.info('Cancel proceed')
      _insist.proceed = false
    }
  }

  return _insist
}

export const useInsist = <T = unknown>(dep?: DependencyList, callback?: InsistCallback<T>, proceed?: boolean): Insist<T> => {
  const insist = useMemo<Insist<T>>(() => createInsist<T>(callback, proceed), [dep])
  useEffect(() => insist.exit, dep ?? [])

  return insist
}
