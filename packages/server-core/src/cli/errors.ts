
export class SystemSecuredError extends Error {
  constructor () {
    super('System is already secured by an owner and can\'t be reinitiated')
  }
}

export class SystemUserError extends Error {
  constructor () {
    super('Can\'t authenticate any system user to perform the action')
  }
}
