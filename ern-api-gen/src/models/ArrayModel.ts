/* tslint:disable:variable-name */
import AbstractModel from './AbstractModel';
import factory from './factory';
import { asMap } from '../java/javaUtil';

export default class ArrayModel extends AbstractModel {
  public type = 'array';
  public __description;
  public __items;
  public properties;
  public example;
  public __minItems;
  public __maxItems;

  public description(description) {
    this.setDescription(description);
    return this;
  }

  public items(items) {
    this.setItems(items);
    return this;
  }

  public minItems(minItems) {
    this.setMinItems(minItems);
    return this;
  }

  public maxItems(maxItems) {
    this.setMaxItems(maxItems);
    return this;
  }

  public getType() {
    return this.type;
  }

  public setType(type) {
    this.type = type;
  }

  public getDescription() {
    return this.__description;
  }

  public setDescription(description) {
    this.__description = description;
  }

  public getItems() {
    return this.__items;
  }

  public setItems(items) {
    this.__items = factory(items);
  }

  public getProperties() {
    return this.properties;
  }

  public setProperties(properties) {
    this.properties = asMap(properties);
  }

  public getExample() {
    return this.example;
  }

  public setExample(example) {
    this.example = example;
  }

  public getMinItems() {
    return this.__minItems;
  }

  public setMinItems(minItems) {
    this.__minItems = minItems;
  }

  public getMaxItems() {
    return this.__maxItems;
  }

  public setMaxItems(maxItems) {
    this.__maxItems = maxItems;
  }

  public clone() {
    const res = new ArrayModel();
    res.type = this.type;
    res.__description = this.__description;
    res.__items = this.__items;
    res.properties = this.properties;
    res.example = this.example;
    res.__minItems = this.__minItems;
    res.__maxItems = this.__maxItems;
    res.vendorExtensions = this.vendorExtensions;
    res.externalDocs = this.externalDocs;
    res.title = this.title;
    res.reference = this.reference;
    return res;
  }
}
