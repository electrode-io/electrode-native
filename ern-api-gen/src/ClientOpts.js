import { newHashMap } from './java/javaUtil'
import StringBuilder from './java/StringBuilder'

export default class ClientOpts {
  properties = newHashMap()

  getUri() {
    return this.uri
  }

  setUri(uri) {
    this.uri = uri
  }

  getTarget() {
    return this.target
  }

  setTarget(target) {
    this.target = target
  }

  getProperties() {
    return this.properties
  }

  setProperties(properties) {
    this.properties = properties
  }

  getOutputDirectory() {
    return this.outputDirectory
  }

  setOutputDirectory(outputDirectory) {
    this.outputDirectory = outputDirectory
  }

  toString() {
    let sb = new StringBuilder()
    sb.append('ClientOpts: {\n')
    sb
      .append('  uri: ')
      .append(this.uri)
      .append(',')
    sb
      .append('  auth: ')
      .append(this.auth)
      .append(',')
    sb.append(this.properties)
    sb.append('}')
    return sb.toString()
  }
}
