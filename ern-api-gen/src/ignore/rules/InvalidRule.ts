import { Rule } from './Rule'

export class InvalidRule extends Rule {
  public reason

  constructor(syntax, definition, reason) {
    super(syntax, definition)
    this.reason = reason
  }

  public matches(relativePath) {
    return false
  }

  public evaluate(relativePath) {
    return Rule.Operation.NOOP
  }

  public getReason() {
    return this.reason
  }
}
