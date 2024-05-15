import type { FC } from 'react'

export interface Toggleable {
  opened: boolean
  open: () => void
  close: () => void
  set: (opened: boolean) => void
  toggle: (opened: boolean) => void
}

export interface ModalManager extends Toggleable {
  Component?: FC<ModalBodyProps>
  callback?: (value: unknown) => void
  notifiers: ModelManagerNotifier[]
  registerNotifier: (notifier: ModelManagerNotifier) => void
  unregisterNotifier: (notifier: ModelManagerNotifier) => void
  respond: (value: unknown) => void
  request: <T>(Com: FC<ModalBodyProps>) => Promise<T>
}

export interface ModalBodyProps {
  callback: (value: unknown) => void
}

export interface ModelManagerNotifier {
  (): void
}
