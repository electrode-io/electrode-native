import { Property } from './Property';

export class StringProperty extends Property {
  public static TYPE = 'string';
  public static allowedProps = [
    ...Property.allowedProps,
    'minLength',
    'maxLength',
    'pattern',
  ];
}
