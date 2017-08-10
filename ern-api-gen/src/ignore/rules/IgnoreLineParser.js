import Part from './Part'
import ParserException from './ParserException'
import {IgnoreToken} from './IgnoreToken'
import StringBuilder from '../../java/StringBuilder'

export class IgnoreLineParser {
  static parse (text) {
    const parts = []
    const sb = new StringBuilder()
    const characters = text.split('')
    let next = null

    for (let i = 0, totalLength = characters.length; i < totalLength; i++) {
      let current = characters[i]
      next = i < totalLength - 1 ? characters[i + 1] : null
      if (i === 0) {
        if ((current === '#')) {
          parts.push(new Part(IgnoreToken.COMMENT, text))
          i = totalLength
          continue
        } else if (current === '!') {
          if (i === totalLength - 1) {
            throw new ParserException('Negation with no negated pattern.')
          } else {
            parts.push(new Part(IgnoreToken.NEGATE))
            continue
          }
        } else if ((current === '\\') && (next === '#')) {
          current = next
          next = null
          i++
        }
      }
      const any = IgnoreToken.MATCH_ANY.getPattern()
      if (any === current) {
        if ((any === next)) {
          if ((i + 3 < totalLength) && (characters[i + 2] === any)) {
            throw new ParserException('The pattern *** is invalid.')
          }
          parts.push(new Part(IgnoreToken.MATCH_ALL))
          i++
          continue
        } else {
          if (sb.length() > 0) {
            parts.push(new Part(IgnoreToken.TEXT, sb.toString()))
            sb.delete(0, sb.length())
          }
          parts.push(new Part(IgnoreToken.MATCH_ANY))
          continue
        }
      }
      if (i === 0 && (IgnoreToken.ROOTED_MARKER.getPattern() === current)) {
        parts.push(new Part(IgnoreToken.ROOTED_MARKER))
        continue
      }
      if ((current === '\\') && (next === ' ')) {
        parts.push(new Part(IgnoreToken.ESCAPED_SPACE))
        i++
        continue
      } else if ((current === '\\') && (next === '!')) {
        parts.push(new Part(IgnoreToken.ESCAPED_EXCLAMATION))
        i++
        continue
      }
      if (IgnoreToken.PATH_DELIM.getPattern() === current) {
        if (i !== totalLength - 1) {
          if (sb.length() > 0) {
            parts.push(new Part(IgnoreToken.TEXT, sb.toString()))
            sb.delete(0, sb.length())
          }
          parts.push(new Part(IgnoreToken.PATH_DELIM))
          if (IgnoreToken.PATH_DELIM.getPattern() === next) {
            i++
          }
          continue
        } else {
          parts.push(new Part(IgnoreToken.TEXT, sb.toString()))
          sb.delete(0, sb.length())
          parts.push(new Part(IgnoreToken.DIRECTORY_MARKER))
          continue
        }
      }
      sb.append(current)
    }
    if (sb.length() > 0) {
      parts.push(new Part(IgnoreToken.TEXT, sb.toString().trim()))
    }
    return parts
  }
}
