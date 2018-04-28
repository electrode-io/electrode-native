import { newHashSet } from './java/javaUtil'
const UPDATE = newHashSet('PUT', 'PATCH')

export default class CodegenOperation {
  responseHeaders = []
  hasMore = true
  isResponseBinary = false
  hasReference = false
  allParams = []
  bodyParams = []
  pathParams = []
  queryParams = []
  headerParams = []
  formParams = []
  responses = []
  imports = newHashSet()

  /**
   * Check if act as Restful index method
   *
   * @return true if act as Restful index method, false otherwise
   */
  isRestfulIndex() {
    return 'GET' === this.httpMethod && '' === this.pathWithoutBaseName()
  }

  /**
   * Check if act as Restful show method
   *
   * @return true if act as Restful show method, false otherwise
   */
  isRestfulShow() {
    return 'GET' === this.httpMethod && this.isMemberPath()
  }

  /**
   * Check if act as Restful create method
   *
   * @return true if act as Restful create method, false otherwise
   */
  isRestfulCreate() {
    return 'POST' === this.httpMethod && '' === this.pathWithoutBaseName()
  }

  /**
   * Check if act as Restful update method
   *
   * @return true if act as Restful update method, false otherwise
   */
  isRestfulUpdate() {
    return UPDATE.contains(this.httpMethod) && this.isMemberPath()
  }

  /**
   * Check if act as Restful destroy method
   *
   * @return true if act as Restful destroy method, false otherwise
   */
  isRestfulDestroy() {
    return 'DELETE' === this.httpMethod && this.isMemberPath()
  }

  /**
   * Check if Restful-style
   *
   * @return true if Restful-style, false otherwise
   */
  isRestful() {
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
  pathWithoutBaseName() {
    return this.baseName != null
      ? this.path.split('/' + this.baseName.toLowerCase()).join('')
      : this.path
  }

  /**
   * Check if the path match format /xxx/:id
   *
   * @return true if path act as member
   */
  isMemberPath() {
    if (this.pathParams.length !== 1) return false
    let id = this.pathParams.get(0).baseName
    return '/{' + id + '}' === this.pathWithoutBaseName()
  }

  toString() {
    return `${this.baseName}(${this.path})`
  }
}
