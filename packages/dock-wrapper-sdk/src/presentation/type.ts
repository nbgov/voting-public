import type { Presentation } from '@docknetwork/crypto-wasm-ts';
import type { PresentationRequest, PresentationRequestQueryItem } from '@smartapps-poll/common'

export type DockPresentationManager = {
	create: <T extends PresentationRequestQueryItem>(request: PresentationRequest<T>) => Promise<PresentationCreationResult>
	dispose: () => void
};

export type PresentationCreator = {
	new(): PresentationCreator
	create: <T extends PresentationRequestQueryItem>(request: PresentationRequest<T>) => Promise<string>
	destroy: () => void
};

export type WindowSDK = {
	PresentationCreator: PresentationCreator
}

export type PresentationCreationResult = {
	status: PresentationCreationStatus
	result: [{ presentation: Presentation }]
	error: Error
}

export enum PresentationCreationStatus {
	CANCELED = 'denied',
	SUCCEEDED = 'ok',
	NOTFOUND = 'not_found',
	MALFORMED = 'bad_request',
	ERROR = 'error'
}
