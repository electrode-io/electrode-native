import Xml from '../Xml';
import { newHashMap } from '../../java/javaUtil';

export class Property {
  public static allowedProps = [
    'title',
    'type',
    'format',
    'description',
    'name',
    'readOnly',
    'position',
    'access',
    'enum',
    'example',
    'externalDocs',
    'required',
    'xml',
    ['default', null, '_'],
  ];

  public getParent;
  public type;
  public format;
  public xml;
  public vendorExtensions;

  constructor(obj?: any, parent?: any) {
    if (parent) {
      this.getParent = () => parent;
    }
  }

  public getType() {
    return this.type || (this.constructor as any).TYPE;
  }

  public getFormat() {
    return this.format || (this.constructor as any).FORMAT;
  }

  public setXml(xml) {
    if (xml instanceof Xml) {
      this.xml = xml;
    }
    this.xml = new Xml(xml);
  }

  public getVendorExtensions() {
    if (!this.vendorExtensions) {
      return newHashMap();
    }
    return this.vendorExtensions;
  }

  public toString() {
    return `[${this.constructor.name}]${JSON.stringify(this, null, 2)}`;
  }

  public toXml() {
    // Emtpy
  }
}
