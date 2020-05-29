import XmlExampleGenerator from './XmlExampleGenerator'
import {
  ArrayProperty,
  BooleanProperty,
  DateProperty,
  DateTimeProperty,
  DecimalProperty,
  DoubleProperty,
  FileProperty,
  FloatProperty,
  IntegerProperty,
  LongProperty,
  MapProperty,
  ObjectProperty,
  RefProperty,
  StringProperty,
  UUIDProperty,
} from '../models/properties'
import Json from '../java/Json'
import { asMap, newHashMap, newHashSet } from '../java/javaUtil'

export default class ExampleGenerator {
  public examples

  constructor(examples) {
    this.examples = examples
  }

  public generate(examples, mediaTypes, property) {
    const output: any[] = []
    const processedModels = newHashSet()
    if (examples == null) {
      if (mediaTypes == null) {
        mediaTypes = ['application/json']
      }
      for (const mediaType of mediaTypes) {
        const kv = newHashMap(['contentType', mediaType])
        if (property != null && mediaType.startsWith('application/json')) {
          const rexample = this.resolvePropertyToExample(
            mediaType,
            property,
            processedModels
          )
          const example = JSON.stringify(rexample, null, 2)
          if (example != null) {
            kv.put('example', example)
            output.push(kv)
          }
        } else if (
          property != null &&
          mediaType.startsWith('application/xml')
        ) {
          const example = new XmlExampleGenerator(this.examples).toXml(property)
          if (example != null) {
            kv.put('example', example)
            output.push(kv)
          }
        }
      }
    } else {
      for (const [contentType, example] of asMap(examples)) {
        output.push(
          newHashMap(
            ['contentType', contentType],
            ['example', Json.pretty(example)]
          )
        )
      }
    }
    if (output.length === 0) {
      output.push(newHashMap(['output', 'none']))
    }
    return JSON.stringify(output)
  }

  public resolvePropertyToExample(mediaType, property, processedModels) {
    if (property.getExample() != null) {
      return property.getExample()
    } else if (property instanceof BooleanProperty) {
      return 'true'
    } else if (property instanceof ArrayProperty) {
      const innerType = property.getItems()
      if (innerType != null) {
        return [
          this.resolvePropertyToExample(mediaType, innerType, processedModels),
        ]
      }
    } else if (property instanceof DateProperty) {
      return '2000-01-23T04:56:07.000+00:00'
    } else if (property instanceof DateTimeProperty) {
      return '2000-01-23T04:56:07.000+00:00'
    } else if (property instanceof DecimalProperty) {
      return Number(1.3579).toPrecision(5)
    } else if (property instanceof DoubleProperty) {
      return Number(3.149).toPrecision(3)
    } else if (property instanceof FileProperty) {
      return ''
    } else if (property instanceof FloatProperty) {
      return Number(1.23).toPrecision(2)
    } else if (property instanceof IntegerProperty) {
      return Number(123).toPrecision(1)
    } else if (property instanceof LongProperty) {
      return Number(123456789).toPrecision(9)
    } else if (property instanceof MapProperty) {
      const mp = newHashMap()
      if ((property as any).getName() != null) {
        mp.put(
          (property as any).getName(),
          this.resolvePropertyToExample(
            mediaType,
            property.getAdditionalProperties(),
            processedModels
          )
        )
      } else {
        mp.put(
          'key',
          this.resolvePropertyToExample(
            mediaType,
            property.getAdditionalProperties(),
            processedModels
          )
        )
      }
      return mp
    } else if (property instanceof ObjectProperty) {
      return '{}'
    } else if (property instanceof RefProperty) {
      const simpleName = property.getSimpleRef()
      const model = this.examples.get(simpleName)
      if (model != null) {
        return this.resolveModelToExample(
          simpleName,
          mediaType,
          model,
          processedModels
        )
      }
    } else if (property instanceof UUIDProperty) {
      return '046b6c7f-0b8a-43b9-b35d-6489e6daee91'
    } else if (property instanceof StringProperty) {
      return 'aeiou'
    }
    return ''
  }

  public resolveModelToExample(name, mediaType, model, processedModels) {
    if (processedModels.contains(name)) {
      return ''
    }
    if (model != null) {
      processedModels.add(name)
      const values = newHashMap()
      if (model.getProperties() != null) {
        for (const [propertyName, property] of model.getProperties()) {
          values.put(
            propertyName,
            this.resolvePropertyToExample(mediaType, property, processedModels)
          )
        }
      }
      return values
    }
    return ''
  }
}
