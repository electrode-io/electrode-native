import { newHashMap } from '../../java/javaUtil';

export default class AbstractSecuritySchemeDefinition {
  public vendorExtensions = newHashMap();
  public type;
  public description;

  public getVendorExtensions() {
    return this.vendorExtensions;
  }

  public getType() {
    return this.type;
  }

  public setType(type) {
    this.type = type;
  }

  public setVendorExtension(name, value) {
    if (name.startsWith('x-')) {
      this.vendorExtensions.put(name, value);
    }
  }

  public setVendorExtensions(vendorExtensions) {
    this.vendorExtensions = vendorExtensions;
  }

  public getDescription() {
    return this.description;
  }

  public setDescription(description) {
    this.description = description;
  }

  public toJSON() {
    return {
      description: this.description,
      vendorExtensions: this.vendorExtensions,
    };
  }
}
