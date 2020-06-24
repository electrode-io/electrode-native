import { ObjectPropertyBase } from './ObjectPropertyBase';

export class ObjectProperty extends ObjectPropertyBase {
  public static TYPE = 'object';
  public static allowedProps = [
    ...ObjectPropertyBase.allowedProps,
    'properties',
  ];
}
