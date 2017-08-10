import {Rule} from './Rule'
export class InvalidRule extends Rule {
  constructor (syntax, definition, reason) {
    super(syntax, definition)
    this.reason = reason
  }

  matches (relativePath) {
    return null
  }

  evaluate (relativePath) {
    return Rule.Operation.NOOP
  }

  getReason () {
    return this.reason
  }
}
