import { Property } from './Property';

export class AbstractNumericProperty extends Property {
  public static allowedProps = [
    ...Property.allowedProps,
    'minimum',
    'maximum',
    'exclusiveMinimum',
    'exclusiveMaximum',
    'multipleOf',
  ];
}
