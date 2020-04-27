/* tslint:disable:variable-name */
import AuthParser from './auth/AuthParser';
import ClientOpts from './ClientOpts';

export default class ClientOptInput {
  public auths;
  private __config;
  private __opts = new ClientOpts();
  private __swagger;

  public swagger(swagger) {
    this.setSwagger(swagger);
    return this;
  }

  public opts(opts) {
    this.setOpts(opts);
    return this;
  }

  public config(codegenConfig) {
    this.setConfig(codegenConfig);
    return this;
  }

  public auth(urlEncodedAuthString) {
    this.setAuth(urlEncodedAuthString);
    return this;
  }

  public getAuth() {
    return AuthParser.reconstruct(this.auths);
  }

  public setAuth(urlEncodedAuthString) {
    this.auths = AuthParser.parse(urlEncodedAuthString);
  }

  public getAuthorizationValues() {
    return this.auths;
  }

  public getConfig() {
    return this.__config;
  }

  public setConfig(config) {
    this.__config = config;
  }

  public getOpts() {
    return this.__opts;
  }

  public setOpts(opts) {
    this.__opts = opts;
  }

  public getSwagger() {
    return this.__swagger;
  }

  public setSwagger(swagger) {
    this.__swagger = swagger;
  }
}
