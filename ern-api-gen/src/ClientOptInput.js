import AuthParser from './auth/AuthParser'
import ClientOpts from './ClientOpts'

export default class ClientOptInput {
  __opts = new ClientOpts()

  swagger(swagger) {
    this.setSwagger(swagger)
    return this
  }

  opts(opts) {
    this.setOpts(opts)
    return this
  }

  config(codegenConfig) {
    this.setConfig(codegenConfig)
    return this
  }

  auth(urlEncodedAuthString) {
    this.setAuth(urlEncodedAuthString)
    return this
  }

  getAuth() {
    return AuthParser.reconstruct(this.auths)
  }

  setAuth(urlEncodedAuthString) {
    this.auths = AuthParser.parse(urlEncodedAuthString)
  }

  getAuthorizationValues() {
    return this.auths
  }

  getConfig() {
    return this.__config
  }

  setConfig(config) {
    this.__config = config
  }

  getOpts() {
    return this.__opts
  }

  setOpts(opts) {
    this.__opts = opts
  }

  getSwagger() {
    return this.__swagger
  }

  setSwagger(swagger) {
    this.__swagger = swagger
  }
}
