/* tslint:disable:variable-name */
import { apply } from '../java/beanUtils';

export default class Xml {
  public __name;
  public __namespace;
  public __prefix;
  public __attribute;
  public __wrapped;

  constructor(obj) {
    if (obj) {
      apply(this, obj);
    }
  }

  public name(name) {
    this.setName(name);
    return this;
  }

  public namespace(namespace) {
    this.setNamespace(namespace);
    return this;
  }

  public prefix(prefix) {
    this.setPrefix(prefix);
    return this;
  }

  public attribute(attribute) {
    this.setAttribute(attribute);
    return this;
  }

  public wrapped(wrapped) {
    this.setWrapped(wrapped);
    return this;
  }

  public getName() {
    return this.__name;
  }

  public setName(name) {
    this.__name = name;
  }

  public getNamespace() {
    return this.__namespace;
  }

  public setNamespace(namespace) {
    this.__namespace = namespace;
  }

  public getPrefix() {
    return this.__prefix;
  }

  public setPrefix(prefix) {
    this.__prefix = prefix;
  }

  public getAttribute() {
    return this.__attribute;
  }

  public setAttribute(attribute) {
    this.__attribute = attribute;
  }

  public getWrapped() {
    return this.__wrapped;
  }

  public setWrapped(wrapped) {
    this.__wrapped = wrapped;
  }
}
