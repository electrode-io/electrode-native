import { apply, beanify } from '../../java/beanUtils';
import { Parameter } from './Parameter';
import { BodyParameter } from './BodyParameter';
import { CookieParameter } from './CookieParameter';
import { FormParameter } from './FormParameter';
import { HeaderParameter } from './HeaderParameter';
import { PathParameter } from './PathParameter';
import { QueryParameter } from './QueryParameter';
import { RefParameter } from './RefParameter';

beanify(Parameter.prototype, [
  'name',
  'enum',
  'in',
  'description',
  'required',
  'type',
  'items',
  'collectionFormat',
  'default',
  'maximum',
  'exclusiveMaximum',
  'minimum',
  'exclusiveMinimum',
  'maxLength',
  'minLength',
  'pattern',
  'maxItems',
  'minItems',
  'uniqueItems',
  'multipleOf',
  'format',
]);

const TYPES = [
  BodyParameter,
  CookieParameter,
  FormParameter,
  HeaderParameter,
  PathParameter,
  QueryParameter,
  RefParameter,
];

export default function (val) {
  if (val instanceof Parameter) {
    return val;
  }

  for (const ParameterType of TYPES) {
    if (ParameterType.TYPE === val.in) {
      const ret = apply(new (ParameterType as any)(val), val);
      return ret;
    }
  }
  if ('$ref' in val) {
    const rp = new RefParameter(val);

    return apply(rp, val);
  }
  throw new Error(`Could not resolve parameter type: ${val.in}`);
}

export * from './Parameter';
export * from './BodyParameter';
export * from './CookieParameter';
export * from './FormParameter';
export * from './HeaderParameter';
export * from './PathParameter';
export * from './QueryParameter';
export * from './RefParameter';
export * from './SerializableParameter';
