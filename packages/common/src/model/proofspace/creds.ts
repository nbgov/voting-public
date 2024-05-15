import type { PsField, PsCredential, CommonPsSubject, RegistrationPsSubject, AuthPsSubject, KeystoreSubject, AsyncRegistrationPsSubject, TelegramPsSubject, PassportPsSubject } from './types'

export const commonPsType = {
  issuedAt: 'Credential Issue Date'
}

export const keystoreType = {
  ...commonPsType,
  store: 'Keystore',
  address: 'Voting Address'
}

export const registrationPsType = {
  ...keystoreType,
  token: 'Auth Code'
}

export const telegramPsType = {
  ...commonPsType,
  telegramId: 'Telegram Id',
  nickname: 'Nickname',
  name: 'Name',
  golos: 'Golos Participant',
  cyberVoter: 'Cyber Voter'
}

export const asyncRegistrationPsType = {
  token: 'Auth Code',
  address: 'Voting Address'
}

export const authPsType = {
  ...commonPsType,
  token: 'Auth Code',
  resource: 'Resource Id'
}

export const authPsSimple = {
  ...commonPsType,
  token: 'Auth Code'
}

export const passportPsType = {
  ...commonPsType,
  nationalId: 'National Identification Number',
  countryCode: 'Country',
  birthdate: 'Date of Birth'
}

export const castSubjectFromPs = (ps: PsCredential, tpl: Record<string, string>): CommonPsSubject =>
  Object.fromEntries(
    Object.entries(tpl).map(
      ([key, name]) => [key, ps.fields.find(field => field.name === name)?.value ?? '']
    )
  ) as CommonPsSubject

export const castTelegramFromPs = (ps: PsCredential): TelegramPsSubject =>
  castSubjectFromPs(ps, telegramPsType) as unknown as TelegramPsSubject

export const castRegistrationFromPs = (ps: PsCredential): RegistrationPsSubject =>
  castSubjectFromPs(ps, registrationPsType) as unknown as RegistrationPsSubject

export const castAsyncRegistrationFromPs = (ps: PsCredential): AsyncRegistrationPsSubject =>
  castSubjectFromPs(ps, asyncRegistrationPsType) as unknown as AsyncRegistrationPsSubject

export const castAuthFromPs = (ps: PsCredential): AuthPsSubject =>
  castSubjectFromPs(ps, authPsType) as unknown as AuthPsSubject

export const castKeystoreFromPs = (ps: PsCredential): KeystoreSubject =>
  castSubjectFromPs(ps, keystoreType) as unknown as KeystoreSubject

export const castPassportFromPs = (ps: PsCredential): PassportPsSubject =>
  castSubjectFromPs(ps, passportPsType) as unknown as PassportPsSubject

export const castPsFieldsFromSubject = <T extends Record<string, unknown>>(ps: T, tpl: Record<string, string>): PsField[] =>
  Object.entries(tpl).map(([field, name]) => ({ name, value: ps[field] as string }))

export const findPsCred = (pss: PsCredential[], criteria: FindPsCredCriteria): PsCredential | undefined =>
  pss.find(ps => ps.schemaId === criteria.schemaId && ps.credentialId === criteria.credentialId)

export interface FindPsCredCriteria { schemaId: string, credentialId: string }
