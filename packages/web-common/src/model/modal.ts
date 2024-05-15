import { type FC, useEffect, useState } from 'react'
import type { ModalBodyProps, ModalManager } from '../component/utils/types'
import { useCtx } from '../context'
import { ModalError } from './errors'

export const buildModalManager = (opened?: boolean): ModalManager => {
  const _manager: ModalManager = {
    notifiers: [],

    opened: opened ?? false,

    open: () => {
      _manager.set(true)
    },

    close: () => {
      _manager.set(false)
    },

    toggle: () => {
      _manager.set(!_manager.opened)
    },

    set: opened => {
      _manager.opened = opened
      _manager.notifiers.map(norifier => norifier())
    },

    registerNotifier: notifier => {
      _manager.notifiers.push(notifier)
    },

    unregisterNotifier: notifier => {
      const idx = _manager.notifiers.findIndex(_notifier => _notifier === notifier)
      _manager.notifiers.splice(idx, 1)
    },

    request: async <T>(Com: FC<ModalBodyProps>) => {
      if (_manager.Component != null || _manager.opened) {
        throw new ModalError()
      }

      return new Promise<T>(resolve => {
        _manager.Component = Com
        _manager.callback = resolve as (value: unknown) => void
        _manager.open()
      })
    },

    respond: value => {
      if (_manager.callback == null) {
        throw new ModalError()
      }
      _manager.callback(value)
      _manager.callback = undefined
      _manager.Component = undefined
    }
  }

  return _manager
}

export const useModalManager = () => {
  const ctx = useCtx()
  const [tick, setTick] = useState(0)
  useEffect(() => {
    let _tick = tick
    const notifier = () => { setTick(++_tick) }
    ctx.modal.registerNotifier(notifier)

    return () => { ctx.modal.unregisterNotifier(notifier) }
  }, [])

  return ctx.modal
}
