import { LocalizedError } from '../../utils/errors'

export class AbstractStrategyError extends LocalizedError {
  constructor (name: string, type: StrategyErrorType, message: string, params?: Record<string, string>) {
    super(`${name}.${type}.strategy.${message}`, { ...params })
  }
}

export class StartegyUnimplementedError extends AbstractStrategyError {
  constructor (name: string, type: StrategyErrorType, method: string) {
    super(name, type, 'method.implemented', { method })
  }
}

export class StartegyImplError extends StartegyUnimplementedError {
  constructor (name: string, method: string) {
    super(name, StrategyErrorType.GENERAL, method)
  }
}

export class WalletStartegyImplError extends StartegyUnimplementedError {
  constructor (name: string, method: string) {
    super(name, StrategyErrorType.WALLET, method)
  }
}

export class CredsStartegyImplError extends StartegyUnimplementedError {
  constructor (name: string, method: string) {
    super(name, StrategyErrorType.CREDS, method)
  }
}

export class ServiceStartegyImplError extends StartegyUnimplementedError {
  constructor (name: string, method: string) {
    super(name, StrategyErrorType.SERVICE, method)
  }
}

export class CensusSyntaxError extends AbstractStrategyError {
  constructor (name: string, message?: string) {
    super(name, StrategyErrorType.SERVICE, `census.${message ?? 'failed'}`)
  }
}

export class VotingSyntaxError extends AbstractStrategyError {
  constructor (name: string, message?: string) {
    super(name, StrategyErrorType.SERVICE, `voting.${message ?? 'failed'}`)
  }
}

export enum StrategyErrorType {
  GENERAL = 'general',
  WALLET = 'wallet',
  CREDS = 'credentials',
  SERVICE = 'voting'
}
