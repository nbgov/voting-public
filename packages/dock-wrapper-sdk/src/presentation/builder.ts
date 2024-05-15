// import { type Presentation } from '@docknetwork/crypto-wasm-ts'
import { type PresentationCreationResult, type DockPresentationManager, type WindowSDK } from './type'

export const buildPresentationManager = (): DockPresentationManager => {
	const _sdk = new (window as unknown as WindowSDK).PresentationCreator()
	const _manager: DockPresentationManager = {
		async create(request) {
			const json = await _sdk.create(request)

			return json as unknown as PresentationCreationResult
			// return Presentation.fromJSON(json);
		},

		/**
		 * @TODO Need to figure out how to do it nicer
		 */
		dispose() {
			_sdk.destroy()
		},
	}

	return _manager
}
