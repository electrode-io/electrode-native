import AuthorizationValue from '../models/auth/AuthorizationValue'
import { log } from 'ern-core'
import { isNotEmpty } from '../java/StringUtils'
import StringBuilder from '../java/StringBuilder'
import { URLDecoder, URLEncoder } from '../java/encoders'

export default class AuthParser {
  public static parse(urlEncodedAuthStr) {
    const auths: AuthorizationValue[] = []
    if (isNotEmpty(urlEncodedAuthStr)) {
      for (const part of urlEncodedAuthStr.split(',')) {
        const kvPair = part.split(':', 2)
        if (kvPair.length === 2) {
          auths.push(
            new AuthorizationValue(
              URLDecoder.decode(kvPair[0]),
              URLDecoder.decode(kvPair[1]),
              'header'
            )
          )
        }
      }
    }
    return auths
  }

  public static reconstruct(authorizationValueList) {
    if (authorizationValueList != null) {
      const b = StringBuilder()
      for (const v of authorizationValueList) {
        try {
          if (b.toString().length > 0) {
            b.append(',')
          }
          b.append(URLEncoder.encode(v.getKeyName()))
            .append(':')
            .append(URLEncoder.encode(v.getValue()))
        } catch (e) {
          log.trace(e)
        }
      }
      return b.toString()
    }

    return null
  }
}
