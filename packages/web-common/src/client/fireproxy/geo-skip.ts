import { DANGEROUS_COUNTRIES } from '@smartapps-poll/common'
import { CommonContext } from '../../context'

let _shouldSkipGeo: boolean | undefined

export const shouldSkipGeo = async (_ctx: CommonContext, force: boolean = false): Promise<boolean> => {
  if (_shouldSkipGeo === undefined || force) {
    console.info('DANGEROUS COUNTRIES', DANGEROUS_COUNTRIES)
    _shouldSkipGeo = true
    if (_ctx.config.geoCheckURL != null) {
      try {
        const result = await fetch(_ctx.config.geoCheckURL)
        if (result.status !== 200) {
          throw new Error('geo.service.reach')
        }
        const response: GeoResponse = await result.json()
        if (response == null) {
          throw new Error('geo.service.wrong')
        }
        if (DANGEROUS_COUNTRIES.includes(response.country)) {
          _shouldSkipGeo = false
        }
      } catch (e) {
        console.error(e)
        _shouldSkipGeo = false
      }
    }
  }

  return _shouldSkipGeo
}

interface GeoResponse {
  ip: string,
  hostname: string,
  city: string,
  region: string,
  country: string,
  loc: string,
  org: string,
  postal: string,
  timezone: string
}
