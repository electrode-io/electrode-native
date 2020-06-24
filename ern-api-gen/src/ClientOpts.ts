import { newHashMap } from './java/javaUtil';
import StringBuilder from './java/StringBuilder';

export default class ClientOpts {
  private properties = newHashMap();
  private uri;
  private target;
  private outputDirectory;
  // [TSCONV] Not set
  private auth;

  public getUri() {
    return this.uri;
  }

  public setUri(uri) {
    this.uri = uri;
  }

  public getTarget() {
    return this.target;
  }

  public setTarget(target) {
    this.target = target;
  }

  public getProperties() {
    return this.properties;
  }

  public setProperties(properties) {
    this.properties = properties;
  }

  public getOutputDirectory() {
    return this.outputDirectory;
  }

  public setOutputDirectory(outputDirectory) {
    this.outputDirectory = outputDirectory;
  }

  public toString() {
    const sb = StringBuilder();
    sb.append('ClientOpts: {\n');
    sb.append('  uri: ').append(this.uri).append(',');
    sb.append('  auth: ').append(this.auth).append(',');
    sb.append(this.properties);
    sb.append('}');
    return sb.toString();
  }
}
