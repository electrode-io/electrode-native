export default class Part {
  constructor (token, value) {
    this.token = token
    this.value = arguments.length < 2 ? token.getPattern() : value
  }

  getToken () {
    return this.token
  }

  getValue () {
    return this.value
  }
}
