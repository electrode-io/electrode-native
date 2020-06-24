import ModelImpl from '../models/ModelImpl';
import RefModel from '../models/RefModel';
import {
  ArrayProperty,
  BooleanProperty,
  DateProperty,
  DateTimeProperty,
  IntegerProperty,
  LongProperty,
  Property,
  RefProperty,
  StringProperty,
} from '../models/properties';

import StringUtils from '../java/StringUtils';
import { Collections, newHashMap, newHashSet } from '../java/javaUtil';
import AbstractModel from '../models/AbstractModel';
import StringBuilder from '../java/StringBuilder';

export default class XmlExampleGenerator {
  public static readonly NEWLINE = '\n';
  public static readonly TAG_START = '<';
  public static readonly CLOSE_TAG = '>';
  public static readonly TAG_END = '</';
  public static readonly EMPTY = '';

  public examples;

  constructor(examples) {
    this.examples = examples;
    if (examples == null) {
      this.examples = newHashMap();
    }
  }

  public modelImplToXml(model, indent, path) {
    const modelName = model.getName();
    if (path.contains(modelName)) {
      return XmlExampleGenerator.EMPTY;
    }
    const selfPath = newHashSet(...path);
    selfPath.add(modelName);
    const sb = StringBuilder();
    const attributes = newHashMap();
    const elements = newHashMap();
    let name = modelName;
    const xml = model.getXml();
    if (xml != null) {
      if (xml.getName() != null) {
        name = xml.getName();
      }
    }
    if (model.getProperties() != null) {
      for (const [pName, p] of model.getProperties()) {
        if (
          p != null &&
          p.getXml() != null &&
          p.getXml().getAttribute() != null &&
          p.getXml().getAttribute()
        ) {
          attributes.put(pName, p);
        } else {
          elements.put(pName, p);
        }
      }
    }
    sb.append(this.indent(indent)).append(XmlExampleGenerator.TAG_START);
    sb.append(name);
    for (const [p, pName] of attributes) {
      sb.append(' ')
        .append(pName)
        .append('=')
        .append(this.quote(this.toXml(null, p, 0, selfPath)));
    }
    sb.append(XmlExampleGenerator.CLOSE_TAG);
    sb.append(XmlExampleGenerator.NEWLINE);
    for (const [pName, p] of elements) {
      const asXml = this.toXml(pName, p, indent + 1, selfPath);
      if (StringUtils.isEmpty(asXml)) {
        continue;
      }
      sb.append(asXml);
      sb.append(XmlExampleGenerator.NEWLINE);
    }
    sb.append(this.indent(indent))
      .append(XmlExampleGenerator.TAG_END)
      .append(name)
      .append(XmlExampleGenerator.CLOSE_TAG);
    return sb.toString();
  }

  public quote(str) {
    return '"' + str + '"';
  }

  public toXml(name, property?: any, indent?: any, path?: any) {
    if (
      (typeof name === 'string' || name === null) &&
      (property instanceof Property || property === null) &&
      (typeof indent === 'number' || indent === null) &&
      (path === null || 'size' in path)
    ) {
      if (property == null) {
        return '';
      }
      const sb = StringBuilder();
      if (property != null && property instanceof ArrayProperty) {
        const p = property;
        const inner = p.getItems();
        let wrapped = false;
        if (
          (property as any).getXml() != null &&
          (property as any).getXml().getWrapped() != null &&
          (property as any).getXml().getWrapped()
        ) {
          wrapped = true;
        }
        if (wrapped) {
          let prefix = XmlExampleGenerator.EMPTY;
          if (name != null) {
            sb.append(this.indent(indent));
            sb.append(this.openTag(name));
            prefix = XmlExampleGenerator.NEWLINE;
          }
          const asXml = this.toXml(name, inner, indent + 1, path);
          if (StringUtils.isNotEmpty(asXml)) {
            sb.append(prefix).append(asXml);
          }
          if (name != null) {
            sb.append(XmlExampleGenerator.NEWLINE);
            sb.append(this.indent(indent));
            sb.append(this.closeTag(name));
          }
        } else {
          sb.append(this.toXml(name, inner, indent, path));
        }
      } else if (property != null && property instanceof RefProperty) {
        const ref = property;
        const actualModel = this.examples.get(ref.getSimpleRef());
        sb.append(this.toXml(actualModel, indent, path));
      } else {
        if (name != null) {
          sb.append(this.indent(indent));
          sb.append(this.openTag(name));
        }
        sb.append(this.getExample(property));
        if (name != null) {
          sb.append(this.closeTag(name));
        }
      }
      return sb.toString();
    } else if (name instanceof Property) {
      return this.toXml(null, name, 0, Collections.emptySet());
    } else if (name instanceof AbstractModel) {
      const model = name;
      if (model != null && model instanceof RefModel) {
        const ref = model;
        const actualModel = this.examples.get(ref.getSimpleRef());
        if (actualModel != null && actualModel instanceof ModelImpl) {
          return this.modelImplToXml(actualModel, indent, path);
        }
      } else if (model != null && model instanceof ModelImpl) {
        return this.modelImplToXml(model, property, indent);
      }
      return null;
    }
    throw new Error(`unknown overload`);
  }

  public getExample(property) {
    if (property instanceof DateTimeProperty) {
      if ((property as any).getExample() != null) {
        return (property as any).getExample().toString();
      }

      return '2000-01-23T04:56:07.000Z';
    }
    if (property instanceof StringProperty) {
      if ((property as any).getExample() != null) {
        return (property as any).getExample().toString();
      }
      return 'string';
    }
    if (property instanceof DateProperty) {
      if ((property as any).getExample() != null) {
        return (property as any).getExample().toString();
      }
      return '2000-01-23T04:56:07.000Z';
    }
    if (property instanceof IntegerProperty) {
      if ((property as any).getExample() != null) {
        return (property as any).getExample().toString();
      }
      return '0';
    }
    if (property instanceof BooleanProperty) {
      if ((property as any).getExample() != null) {
        return (property as any).getExample().toString();
      }
      return 'true';
    }
    if (property instanceof LongProperty) {
      if ((property as any).getExample() != null) {
        return (property as any).getExample().toString();
      }
      return '123456';
    }
    return 'not implemented ' + property;
  }

  public openTag(name) {
    return '<' + name + '>';
  }

  public closeTag(name) {
    return '</' + name + '>';
  }

  public indent(indent) {
    const sb = StringBuilder();
    for (let i = 0; i < indent; i++) {
      sb.append('  ');
    }
    return sb.toString();
  }
}
