import {
  type BaseVotingStrategy,
  type CredentialsWalletStrategy,
  type VotingServiceStrategy,
  type VotingStrategy,
  type VotingStrategyBuilder,
  type VotingWalletStrategy
} from './types'

export const createBasicStrategyBuilder = <C>(context: C): VotingStrategyBuilder<C> => {
  let votingWallet: VotingWalletStrategy<C>
  let credWallet: CredentialsWalletStrategy<C>
  let service: VotingServiceStrategy<C>

  const _builder: VotingStrategyBuilder<C> = {
    voting: {
      wallet: wallet => {
        votingWallet = wallet
        return _builder
      },

      service: _service => {
        service = _service
        return _builder
      }
    },

    credentials: {
      wallet: wallet => {
        credWallet = wallet
        return _builder
      }
    },

    build: () => {
      const _strategy: BaseVotingStrategy<C> = {
        ctx: () => context,
        wallet: () => votingWallet,
        service: () => service,
        creds: () => credWallet
      }

      votingWallet.setStrategyContext(_strategy as VotingStrategy<C>)
      credWallet.setStrategyContext(_strategy as VotingStrategy<C>)
      service.setStrategyContext(_strategy as VotingStrategy<C>)

      const strategy = _strategy as VotingStrategy<C>

      strategy.isAuthenticated = () =>
        _strategy.creds().isAuthenticated() &&
        _strategy.wallet().isAuthenticated() &&
        _strategy.service().isAuthenticated()

      strategy.getAddress = async () =>
        await _strategy.wallet().getAddress()

      return strategy
    }
  }

  return _builder
}
