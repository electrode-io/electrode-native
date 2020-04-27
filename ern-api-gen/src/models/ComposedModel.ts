/* tslint:disable:variable-name */
import AbstractModel from './AbstractModel';

export default class ComposedModel extends AbstractModel {
  public allOf: any[] = [];
  public description;
  public example;
  public __parent;
  public __child;
  public __interfaces;

  public parent(model) {
    this.setParent(model);
    return this;
  }

  public child(model) {
    this.setChild(model);
    return this;
  }

  public interfaces(interfaces) {
    this.setInterfaces(interfaces);
    return this;
  }

  public getDescription() {
    return this.description;
  }

  public setDescription(description) {
    this.description = description;
  }

  public getProperties() {
    return null;
  }

  public setProperties(properties) {
    // Empty
  }

  public getExample() {
    return this.example;
  }

  public setExample(example) {
    this.example = example;
  }

  public getAllOf() {
    return this.allOf;
  }

  public setAllOf(allOf) {
    this.allOf = allOf;
  }

  public getParent() {
    return this.__parent;
  }

  public setParent(model) {
    this.__parent = model;
    if (this.allOf.indexOf(model) === -1) {
      this.allOf.push(model);
    }
  }

  public getChild() {
    return this.__child;
  }

  public setChild(model) {
    this.__child = model;
    if (this.allOf.indexOf(model) === -1) {
      this.allOf.push(model);
    }
  }

  public getInterfaces() {
    return this.__interfaces;
  }

  public setInterfaces(interfaces) {
    this.__interfaces = interfaces;
    for (const model of interfaces) {
      if (this.allOf.indexOf(model) === -1) {
        this.allOf.push(model);
      }
    }
  }

  public clone() {
    const res = new ComposedModel();
    res.allOf = this.allOf;
    res.description = this.description;
    res.example = this.example;
    res.__parent = this.__parent;
    res.__child = this.__child;
    res.__interfaces = this.__interfaces;
    res.vendorExtensions = this.vendorExtensions;
    res.externalDocs = this.externalDocs;
    res.title = this.title;
    res.reference = this.reference;
    return res;
  }
}
