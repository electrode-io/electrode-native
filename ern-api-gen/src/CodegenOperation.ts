import { newHashSet } from './java/javaUtil'

const UPDATE = newHashSet('PUT', 'PATCH')

export default class CodegenOperation {
  public responseHeaders = []
  public hasMore = true
  public isResponseBinary = false
  public hasReference = false
  public allParams = []
  public bodyParams = []
  public pathParams = []
  public queryParams = []
  public headerParams = []
  public formParams = []
  public responses = []
  public imports = newHashSet()
  // [TSCONV: not set]
  public httpMethod
  public baseName
  public path

  /**
   * Check if act as Restful index method
   *
   * @return true if act as Restful index method, false otherwise
   */
  public isRestfulIndex() {
    return 'GET' === this.httpMethod && '' === this.pathWithoutBaseName()
  }

  /**
   * Check if act as Restful show method
   *
   * @return true if act as Restful show method, false otherwise
   */
  public isRestfulShow() {
    return 'GET' === this.httpMethod && this.isMemberPath()
  }

  /**
   * Check if act as Restful create method
   *
   * @return true if act as Restful create method, false otherwise
   */
  public isRestfulCreate() {
    return 'POST' === this.httpMethod && '' === this.pathWithoutBaseName()
  }

  /**
   * Check if act as Restful update method
   *
   * @return true if act as Restful update method, false otherwise
   */
  public isRestfulUpdate() {
    return UPDATE.contains(this.httpMethod) && this.isMemberPath()
  }

  /**
   * Check if act as Restful destroy method
   *
   * @return true if act as Restful destroy method, false otherwise
   */
  public isRestfulDestroy() {
    return 'DELETE' === this.httpMethod && this.isMemberPath()
  }

  /**
   * Check if Restful-style
   *
   * @return true if Restful-style, false otherwise
   */
  public isRestful() {
    return (
      this.isRestfulIndex() ||
      this.isRestfulShow() ||
      this.isRestfulCreate() ||
      this.isRestfulUpdate() ||
      this.isRestfulDestroy()
    )
  }

  /**
   * Get the substring except baseName from path
   *
   * @return the substring
   */
  public pathWithoutBaseName() {
    return this.baseName != null
      ? this.path.split('/' + this.baseName.toLowerCase()).join('')
      : this.path
  }

  /**
   * Check if the path match format /xxx/:id
   *
   * @return true if path act as member
   */
  public isMemberPath() {
    if (this.pathParams.length !== 1) {
      return false
    }
    const id = (this.pathParams[0] as any).baseName
    return '/{' + id + '}' === this.pathWithoutBaseName()
  }

  public toString() {
    return `${this.baseName}(${this.path})`
  }
}
