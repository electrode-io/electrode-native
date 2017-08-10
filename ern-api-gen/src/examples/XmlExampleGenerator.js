import ModelImpl from '../models/ModelImpl'
import RefModel from '../models/RefModel'
import {
    Property, ArrayProperty,
    BooleanProperty,
    DateProperty,
    DateTimeProperty,
    IntegerProperty,
    LongProperty,
    RefProperty,
    StringProperty
} from '../models/properties'

import StringUtils from '../java/StringUtils'
import {Collections, newHashMap, newHashSet} from '../java/javaUtil'
import AbstractModel from '../models/AbstractModel'
import StringBuilder from '../java/StringBuilder'

export default class XmlExampleGenerator {
  constructor (examples) {
    this.examples = examples
    if (examples == null) {
      this.examples = newHashMap()
    }
  }

  modelImplToXml (model, indent, path) {
    const modelName = model.getName()
    if (path.contains(modelName)) {
      return XmlExampleGenerator.EMPTY
    }
    const selfPath = newHashSet(...path)
    selfPath.add(modelName)
    const sb = new StringBuilder()
    const attributes = newHashMap()
    const elements = newHashMap()
    let name = modelName
    const xml = model.getXml()
    if (xml != null) {
      if (xml.getName() != null) {
        name = xml.getName()
      }
    }
    if (model.getProperties() != null) {
      for (const [pName, p] of model.getProperties()) {
        if (p != null && p.getXml() != null && p.getXml().getAttribute() != null && p.getXml().getAttribute()) {
          attributes.put(pName, p)
        } else {
          elements.put(pName, p)
        }
      }
    }
    sb.append(this.indent(indent)).append(XmlExampleGenerator.TAG_START)
    sb.append(name)
    for (const [p, pName] of attributes) {
      sb.append(' ').append(pName).append('=').append(this.quote(this.toXml(null, p, 0, selfPath)))
    }
    sb.append(XmlExampleGenerator.CLOSE_TAG)
    sb.append(XmlExampleGenerator.NEWLINE)
    for (const [pName, p] of elements) {
      let asXml = this.toXml(pName, p, indent + 1, selfPath)
      if (StringUtils.isEmpty(asXml)) {
        continue
      }
      sb.append(asXml)
      sb.append(XmlExampleGenerator.NEWLINE)
    }
    sb.append(this.indent(indent)).append(XmlExampleGenerator.TAG_END).append(name).append(XmlExampleGenerator.CLOSE_TAG)
    return sb.toString()
  }

  quote (string) {
    return '"' + string + '"'
  }

  toXml (name, property, indent, path) {
    if ((typeof name === 'string' || name === null) && (property instanceof Property || property === null) && ((typeof indent === 'number') || indent === null) && (path === null || 'size' in path)) {
      if (property == null) {
        return ''
      }
      let sb = new StringBuilder()
      if (property != null && property instanceof ArrayProperty) {
        let p = property
        let inner = p.getItems()
        let wrapped = false
        if (property.getXml() != null && property.getXml().getWrapped() != null && property.getXml().getWrapped()) {
          wrapped = true
        }
        if (wrapped) {
          let prefix = XmlExampleGenerator.EMPTY
          if (name != null) {
            sb.append(this.indent(indent))
            sb.append(this.openTag(name))
            prefix = XmlExampleGenerator.NEWLINE
          }
          let asXml = this.toXml(name, inner, indent + 1, path)
          if (StringUtils.isNotEmpty(asXml)) {
            sb.append(prefix).append(asXml)
          }
          if (name != null) {
            sb.append(XmlExampleGenerator.NEWLINE)
            sb.append(this.indent(indent))
            sb.append(this.closeTag(name))
          }
        } else {
          sb.append(this.toXml(name, inner, indent, path))
        }
      } else if (property != null && property instanceof RefProperty) {
        let ref = property
        let actualModel = this.examples.get(ref.getSimpleRef())
        sb.append(this.toXml(actualModel, indent, path))
      } else {
        if (name != null) {
          sb.append(this.indent(indent))
          sb.append(this.openTag(name))
        }
        sb.append(this.getExample(property))
        if (name != null) {
          sb.append(this.closeTag(name))
        }
      }
      return sb.toString()
    } else if (name instanceof Property) {
      return this.toXml(null, name, 0, Collections.emptySet())
    } else if (name instanceof AbstractModel) {
      const model = name
      if (model != null && model instanceof RefModel) {
        let ref = model
        let actualModel = this.examples.get(ref.getSimpleRef())
        if (actualModel != null && actualModel instanceof ModelImpl) {
          return this.modelImplToXml(actualModel, indent, path)
        }
      } else if (model != null && model instanceof ModelImpl) {
        return this.modelImplToXml(model, property, indent)
      }
      return null
    }
    throw new Error(`unknown overload`)
  }

  getExample (property) {
    if (property instanceof DateTimeProperty) {
      if (property.getExample() != null) {
        return property.getExample().toString()
      }

      return '2000-01-23T04:56:07.000Z'
    }
    if (property instanceof StringProperty) {
      if (property.getExample() != null) {
        return property.getExample().toString()
      }
      return 'string'
    }
    if (property instanceof DateProperty) {
      if (property.getExample() != null) {
        return property.getExample().toString()
      }
      return '2000-01-23T04:56:07.000Z'
    }
    if (property instanceof IntegerProperty) {
      if (property.getExample() != null) {
        return property.getExample().toString()
      }
      return '0'
    }
    if (property instanceof BooleanProperty) {
      if (property.getExample() != null) {
        return property.getExample().toString()
      }
      return 'true'
    }
    if (property instanceof LongProperty) {
      if (property.getExample() != null) {
        return property.getExample().toString()
      }
      return '123456'
    }
    return 'not implemented ' + property
  }

  openTag (name) {
    return '<' + name + '>'
  }

  closeTag (name) {
    return '</' + name + '>'
  }

  indent (indent) {
    let sb = new StringBuilder()
    for (let i = 0; i < indent; i++) {
      sb.append('  ')
    }
    return sb.toString()
  }
}
XmlExampleGenerator.NEWLINE = '\n'
XmlExampleGenerator.TAG_START = '<'
XmlExampleGenerator.CLOSE_TAG = '>'
XmlExampleGenerator.TAG_END = '</'
XmlExampleGenerator.EMPTY = ''
