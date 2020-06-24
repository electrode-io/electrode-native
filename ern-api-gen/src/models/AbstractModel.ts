import { newHashMap } from '../java/javaUtil';

export default class AbstractModel {
  public vendorExtensions = newHashMap();
  public externalDocs;
  public title;
  public reference;

  public getExternalDocs() {
    return this.externalDocs;
  }

  public setExternalDocs(value) {
    this.externalDocs = value;
  }

  public getTitle() {
    return this.title;
  }

  public setTitle(title) {
    this.title = title;
  }

  public getVendorExtensions() {
    return this.vendorExtensions;
  }

  public setVendorExtension(name, value) {
    if (typeof name === 'string' && name.startsWith('x-')) {
      this.vendorExtensions.put(name, value);
    }
  }

  public setVendorExtensions(vendorExtensions) {
    this.vendorExtensions = vendorExtensions;
  }

  public getReference() {
    return this.reference;
  }

  public setReference(reference) {
    this.reference = reference;
  }
}
