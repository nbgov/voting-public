import type { DockCredential, NBRiskPayload, PassportSubject } from '@smartapps-poll/common'
import type { VeriffRiskPart } from '../veriff/types'
import { VERIFF_MISSED_RISK_LABEL, veriffAllCateogries, veriffSuspiciousLabels } from '../veriff/consts'
import type { Context } from '../../types'

export const extractNBRisks = (subject: PassportSubject): VeriffRiskPart => {
  if (subject.meta != null) {
    try {
      const meta = Buffer.from(subject.meta, 'base64').toString('utf8')
      const payload: NBRiskPayload = JSON.parse(meta)
      const risk: VeriffRiskPart = {}
      if (payload.risk?.score != null) {
        risk.riskScore = { score: payload.risk.score }
      }
      if (payload.risk?.labels != null) {
        risk.riskLabels = payload.risk.labels.map(label => {
          return {
            label: label.name != null ? label.name : label.label != null
              ? label.label : VERIFF_MISSED_RISK_LABEL,
            category: label.category
          }
        })
      }
      return risk
    } catch (e) {
      console.log("Can't parse risks JSON")
      throw e
    }
  }
  return {}
}

export const stabNBMeta = (ctx: Context, passport?: DockCredential<PassportSubject>): DockCredential<PassportSubject> | undefined => {
  if (ctx.config.devMode && passport != null && passport.credentialSubject.meta == null) {
    passport = JSON.parse(JSON.stringify(passport)) as DockCredential<PassportSubject>

    passport.credentialSubject.meta = Buffer.from(
      JSON.stringify({
        risk: {
          score: Math.random(),
          labels: [
            { name: null, category: 'person' },
            { name: undefined, category: 'person' },
            { name: '', category: 'person' },
            { name: null, category: 'document' },
            { name: undefined, category: 'document' },
            { name: '', category: 'document' },
            { name: null, category: 'crosslinks' },
            { name: undefined, category: 'crosslinks' },
            { name: '', category: 'crosslinks' },
            { label: null, category: 'person' },
            { label: undefined, category: 'person' },
            { label: '', category: 'person' },
            { label: null, category: 'document' },
            { label: undefined, category: 'document' },
            { label: '', category: 'document' },
            { label: null, category: 'crosslinks' },
            { label: undefined, category: 'crosslinks' },
            { label: '', category: 'crosslinks' },
            ...veriffSuspiciousLabels.flatMap(label => [
              { label, category: veriffAllCateogries[Math.floor(Math.random() * 3)] },
              { name: label, category: veriffAllCateogries[Math.floor(Math.random() * 3)] }
            ])
          ].filter(() => Math.random() < 0.05)
        }
      }),

    ).toString('base64')

    return passport
  }

  return passport
}
