/* tslint:disable:variable-name */
import SwiftCodegen from './SwiftCodegen'
import ernify from './ERNMixin'
import { newHashMap } from '../java/javaUtil'

export default class ErnSwiftCodegen extends SwiftCodegen {
  public library = 'ern'
  public __apiPackage = 'io.swagger.client.api'
  public __supportedLibraries = newHashMap([
    'ern',
    'ERN plugin makes this platform work',
  ])
  public unwrapRequired = true

  constructor() {
    super()
    this.__typeMapping.put('int', 'Int')
    this.__typeMapping.put('integer', 'Int')
    this.sourceFolder = ''
  }

  public modelFileFolder() {
    return this.__outputFolder
  }

  public apiFileFolder() {
    return this.__outputFolder
  }

  public processOpts() {
    super.processOpts()
    // Events and Requests files.
    const f = this[
      `addSupportingFilesFor${SwiftCodegen.camelize(this.getLibrary())}`
    ]
    if (f) {
      f.call(this)
    }
  }

  public addSupportingFilesForErn() {
    this.__apiTemplateFiles.put('apirequests.mustache', '.swift')
    this.__apiTemplateFiles.put('apievents.mustache', '.swift')
    this.__apiDataTemplateFile.put('apidatamodel.mustache', '.swift')
  }

  public getName() {
    return 'ERNSwift'
  }
}

ernify(ErnSwiftCodegen)
