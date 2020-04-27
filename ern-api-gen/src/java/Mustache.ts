/* tslint:disable:variable-name */
import Mustache from 'mustache';
import Json from './Json';
import { log } from 'ern-core';
import { MustacheWriter } from './MustacheWriter';
import { isIterable } from './isIterable';

function truthy(val) {
  if (val == null || val.length === 0 || val === false) {
    return false;
  }
  return true;
}
function isInt(val) {
  return /^\d+?$/.test(val);
}
class MyContext extends Mustache.Context {
  protected _first: any;
  protected _last: any;

  constructor(value, parent?: any, first?: any, last?: any) {
    super(value, parent);
    this._first = first;
    this._last = last;
  }

  public lookup(name) {
    if (/-?last/.test(name)) {
      return this._last;
    }
    if (/-?first/.test(name)) {
      return this._first;
    }
    // match the dot, unless it is followed only by a number, than we guess its an array and
    // we will let the natural path happen.
    if (/.+?\.(?!\d+?$).+?$/.test(name)) {
      const filters = name.split(/(\-|\+|\.)/);
      const arr = super.lookup(filters.shift());
      if (!isIterable(arr)) {
        return arr;
      }
      // Using a Set to prevent duplicates, this may be a mistake.
      const ret = new Set();
      FILTER: for (let v of arr) {
        for (let i = 0, l = filters.length; i < l; i += 2) {
          const pm = filters[i];
          const prop = filters[i + 1];
          if (pm === '+') {
            if (!truthy(v[prop])) {
              continue FILTER;
            }
          } else if (pm === '-') {
            if (truthy(v[prop])) {
              continue FILTER;
            }
          } else if (pm === '.' && prop) {
            if (v != null) {
              v = v[prop];
            }
          }
        }
        ret.add(v);
      }
      return Array.from(ret);
    }
    return super.lookup(name);
  }

  public push(view, first?: any, last?: any) {
    return new MyContext(view, this, first, last);
  }
}

export default {
  compiler() {
    let defValue;
    const partials = {};
    let partialProxy;
    const cret = {
      withLoader(_loader) {
        const handler = {
          get(target, name) {
            if (name in target) {
              return target[name];
            }
            return (target[name] = _loader.getTemplate(name));
          },
        };
        partialProxy = (name) => {
          return _loader.getTemplate(name);
        };
        return cret;
      },
      defaultValue(def) {
        defValue = def;
        return cret;
      },
      compile(template, file?: any) {
        const writer: any = new MustacheWriter();

        return {
          execute(data) {
            try {
              data = JSON.parse(Json.pretty(data));
              return writer.render(template, new MyContext(data), partialProxy);
            } catch (e) {
              log.trace(e);
              throw new Error(`Error invoking template ${file}`);
            }
          },
        };
      },
    };
    return cret;
  },
};
