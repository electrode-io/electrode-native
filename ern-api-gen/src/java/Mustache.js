import Mustache from 'mustache'
import Json from './Json'
import LoggerFactory from './LoggerFactory'
function truthy (val) {
  if (val == null || val.length === 0 || val === false) { return false }
  return true
}
function isInt (val) {
  return /^\d+?$/.test(val)
}
class MyContext extends Mustache.Context {
  constructor (value, parent, first, last) {
    super(value, parent)
    this._first = first
    this._last = last
  }

  lookup (name) {
    if (/-?last/.test(name)) {
      return this._last
    }
    if (/-?first/.test(name)) {
      return this._first
    }
        // match the dot, unless it is followed only by a number, than we guess its an array and
        // we will let the natural path happen.
    if (/.+?\.(?!\d+?$).+?$/.test(name)) {
      const filters = name.split(/(\-|\+|\.)/)
      let arr = super.lookup(filters.shift())
      if (!isIterable(arr)) {
        return arr
      }
            // Using a Set to prevent duplicates, this may be a mistake.
      const ret = new Set()
      FILTER: for (let v of arr) {
        for (let i = 0, l = filters.length; i < l; i += 2) {
          const pm = filters[i]
          const prop = filters[i + 1]
          if (pm == '+') {
            if (!truthy(v[prop])) { continue FILTER }
          } else if (pm === '-') {
            if (truthy(v[prop])) { continue FILTER }
          } else if (pm === '.' && prop) {
            if (v != null) { v = v[prop] }
          }
        }
        ret.add(v)
      }
      return Array.from(ret)
    }
    return super.lookup(name)
  }

  push (view, first, last) {
    return new MyContext(view, this, first, last)
  };
}

function isIterable (obj) {
    // checks for null and undefined
  if (obj == null) {
    return false
  }
    // Don't consider a string iterable.
  if (typeof obj === 'string') {
    return false
  }
  return typeof obj[Symbol.iterator] === 'function'
}

class MustacheWriter extends Mustache.Writer {
  renderSection (token, context, partials, originalTemplate) {
    let buffer = ''
    let value = context.lookup(token[1])

    if (!value) return

    if (isIterable(value)) {
      const itr = value[Symbol.iterator]()
      let first = itr.next()
      let isFirst = true
      while (!first.done) {
        const next = itr.next()
        if (first.value != null) {
          const ctx = context.push(first.value, isFirst, next.done)
          buffer += this.renderTokens(token[4], ctx, partials, originalTemplate)
        }
        isFirst = false
        first = next
      }
      return buffer
    } else if (typeof value === 'object' || typeof value === 'string' || typeof value === 'number') {
      buffer += this.renderTokens(token[4], context.push(value), partials, originalTemplate)
    } else if (typeof value === 'function') {
      if (typeof originalTemplate !== 'string') { throw new Error('Cannot use higher-order sections without the original template') }

            // Extract the portion of the original template that the section contains.
      value = value.call(context.view, originalTemplate.slice(token[3], token[5]), (template) => this.render(template, context, partials))

      if (value != null) { buffer += value }
    } else {
      buffer += this.renderTokens(token[4], context, partials, originalTemplate)
    }
    return buffer
  };
}

const Log = LoggerFactory.getLogger('Mustache')
export default ({
  compiler () {
    let defValue
    const partials = {}
    let partialProxy
    const cret = {

      withLoader (_loader) {
        const handler = {
          get (target, name) {
            if (name in target) return target[name]
            return (target[name] = _loader.getTemplate(name))
          }
        }
        partialProxy = function (name) {
          return _loader.getTemplate(name)
        }
        return cret
      },
      defaultValue (def) {
        defValue = def
        return cret
      },
      compile (template, file) {
        const writer = new MustacheWriter()

        return {
          execute (data) {
            try {
              data = JSON.parse(Json.pretty(data))
              return writer.render(template, new MyContext(data), partialProxy)
            } catch (e) {
              Log.trace(e)
              throw new Error(`Error invoking template ${file}`)
            }
          }
        }
      }
    }
    return cret
  }
})
