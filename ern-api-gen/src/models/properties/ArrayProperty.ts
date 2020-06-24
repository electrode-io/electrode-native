/* tslint:disable:variable-name */
import { Property } from './Property';
import factory from '../factory';

export class ArrayProperty extends Property {
  public static TYPE = 'array';
  public static allowedProps = [
    ...Property.allowedProps,
    'uniqueItems',
    'items',
    'maxItems',
    'minItems',
  ];

  public _items;

  public items(items) {
    this.setItems(items);
    return this;
  }

  public getItems() {
    return this._items;
  }

  public setItems(items) {
    this._items = factory(items, this);
  }
}
