import { Rule } from './Rule'

/**
 * An ignore rule which matches everything.
 */
export class EverythingRule extends Rule {
  constructor(syntax, definition) {
    super(syntax, definition)
  }

  public matches(relativePath) {
    return true
  }

  public getExcludeOperation() {
    return Rule.Operation.EXCLUDE_AND_TERMINATE
  }
}
