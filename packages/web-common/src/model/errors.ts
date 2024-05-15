
export class ModalError extends Error {
  constructor(message?: string) {
    super(message ?? 'modal.invoced')
  }
}
