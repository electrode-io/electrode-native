import AbstractSecuritySchemeDefinition from './AbstractSecuritySchemeDefinition'
import { asMap, newHashMap } from '../../java/javaUtil'

export default class OAuth2Definition extends AbstractSecuritySchemeDefinition {
  public static TYPE = 'oauth2'
  public type = OAuth2Definition.TYPE
  public authorizationUrl
  public tokenUrl
  public flow
  public scopes

  public implicit(authorizationUrl) {
    this.setAuthorizationUrl(authorizationUrl)
    this.setFlow('implicit')
    return this
  }

  public password(tokenUrl) {
    this.setTokenUrl(tokenUrl)
    this.setFlow('password')
    return this
  }

  public application(tokenUrl) {
    this.setTokenUrl(tokenUrl)
    this.setFlow('application')
    return this
  }

  public accessCode(authorizationUrl, tokenUrl) {
    this.setTokenUrl(tokenUrl)
    this.setAuthorizationUrl(authorizationUrl)
    this.setFlow('accessCode')
    return this
  }

  public scope(name, description) {
    this.addScope(name, description)
    return this
  }

  public getAuthorizationUrl() {
    return this.authorizationUrl
  }

  public setAuthorizationUrl(authorizationUrl) {
    this.authorizationUrl = authorizationUrl
  }

  public getTokenUrl() {
    return this.tokenUrl
  }

  public setTokenUrl(tokenUrl) {
    this.tokenUrl = tokenUrl
  }

  public getFlow() {
    return this.flow
  }

  public setFlow(flow) {
    this.flow = flow
  }

  public getScopes() {
    return this.scopes
  }

  public setScopes(scopes) {
    this.scopes = asMap(scopes)
  }

  public addScope(name, description) {
    if (this.scopes == null) {
      this.scopes = newHashMap()
    }
    this.scopes.put(name, description)
  }

  public toJSON() {
    return Object.assign(super.toJSON(), {
      authorizationUrl: this.authorizationUrl,
      flow: this.flow,
      scopes: this.scopes,
      tokenUrl: this.tokenUrl,
      type: this.type,
    })
  }
}
