import IgnoreToken from './IgnoreToken'
import StringBuilder from '../../java/StringBuilder'
import { log } from 'ern-core'

export abstract class Rule {
  public static Operation = {
    EXCLUDE: 0,
    EXCLUDE_AND_TERMINATE: 3,
    INCLUDE: 1,
    NOOP: 2,
  }

  public syntax
  public definition

  constructor(syntax, definition) {
    this.syntax = syntax
    this.definition = definition
  }

  public getDefinition() {
    return this.definition
  }

  public getPattern() {
    if (this.syntax == null) {
      return this.definition
    }
    const sb = StringBuilder()
    for (const current of this.syntax) {
      const token = current.getToken()

      switch (token) {
        case IgnoreToken.MATCH_ALL:
        case IgnoreToken.MATCH_ANY:
        case IgnoreToken.ESCAPED_EXCLAMATION:
        case IgnoreToken.ESCAPED_SPACE:
        case IgnoreToken.PATH_DELIM:
        case IgnoreToken.TEXT:
        case IgnoreToken.DIRECTORY_MARKER:
          sb.append(current.getValue())
          break
        case IgnoreToken.NEGATE:
        case IgnoreToken.ROOTED_MARKER:
        case IgnoreToken.COMMENT:
          break
        default:
          log.warn('unknown token')
      }
    }
    return sb.toString()
  }

  /**
   * Whether or not the rule should be negated. !foo means foo should be removed from previous matches.
   * Example: **\/*.bak excludes all backup. Adding !/test.bak will include test.bak in the project root.
   * <p>
   * NOTE: It is not possible to re-include a file if a parent directory of that file is excluded.
   */
  public getNegated() {
    const negated =
      this.syntax &&
      this.syntax[0] &&
      this.syntax[0].getToken().equals(IgnoreToken.NEGATE)
    return negated
  }

  public evaluate(relativePath) {
    if (this.matches(relativePath)) {
      if (this.getNegated()) {
        return this.getIncludeOperation()
      }
      return this.getExcludeOperation()
    }
    return Rule.Operation.NOOP
  }

  public getIncludeOperation() {
    return Rule.Operation.INCLUDE
  }

  public getExcludeOperation() {
    return Rule.Operation.EXCLUDE
  }

  protected abstract matches(relativePath: any): boolean
}
