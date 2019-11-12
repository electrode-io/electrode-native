import ArrayModel from './models/ArrayModel'
import ModelImpl from './models//ModelImpl'
import RefModel from './models/RefModel'
import { BodyParameter, RefParameter } from './models/parameters'
import {
  ArrayProperty,
  MapProperty,
  ObjectProperty,
  RefProperty,
} from './models/properties'
import Json from './java/Json'
import { newHashMap, isNotEmptySet } from './java/javaUtil'

function hasProperties(obj) {
  if (obj == null) {
    return false
  }
  return isNotEmptySet(obj.getProperties())
}

export default class InlineModelResolver {
  public addedModels = newHashMap()
  public generatedSignature = newHashMap()
  public skipMatches = false
  public swagger

  public flatten(swagger) {
    this.swagger = swagger
    if (swagger.getDefinitions() == null) {
      swagger.setDefinitions(newHashMap())
    }
    const paths = swagger.getPaths()
    const models = swagger.getDefinitions()
    if (paths != null) {
      for (const path of paths) {
        const pathname = path.path
        for (const operation of path.getOperations()) {
          const parameters = operation.getParameters()

          if (isNotEmptySet(parameters)) {
            for (const parameter of parameters) {
              if (parameter != null && parameter instanceof BodyParameter) {
                const bp: any = parameter
                if (bp.getSchema() != null) {
                  const model = bp.getSchema()
                  if (model != null && model instanceof ModelImpl) {
                    const obj = model
                    if (obj.getType() == null || 'object' === obj.getType()) {
                      if (isNotEmptySet(obj.getProperties())) {
                        this.flattenProperties(obj.getProperties(), pathname)
                        const modelName = this.resolveModelName(
                          obj.getTitle(),
                          bp.getName()
                        )
                        bp.setSchema(new RefModel(modelName))
                        this.addGenerated(modelName, model)
                        swagger.addDefinition(modelName, model)
                      }
                    }
                  } else if (model != null && model instanceof ArrayModel) {
                    const am = model
                    const inner = am.getItems()
                    if (inner != null && inner instanceof ObjectProperty) {
                      const op: any = inner
                      if (isNotEmptySet(op.getProperties())) {
                        this.flattenProperties(op.getProperties(), pathname)
                        const modelName = this.resolveModelName(
                          op.getTitle(),
                          bp.getName()
                        )
                        const innerModel = this.modelFromProperty(op, modelName)
                        const existing = this.matchGenerated(innerModel)
                        if (existing != null) {
                          am.setItems(new RefProperty(existing))
                        } else {
                          am.setItems(new RefProperty(modelName))
                          this.addGenerated(modelName, innerModel)
                          swagger.addDefinition(modelName, innerModel)
                        }
                      }
                    }
                  }
                }
              }
            }
          }
          const responses = operation.getResponses()
          if (isNotEmptySet(responses)) {
            for (const [key, response] of responses) {
              const property = response.getSchema()
              if (property == null) {
                continue
              }
              if (property instanceof ObjectProperty) {
                const op: any = property
                if (hasProperties(op)) {
                  const modelName = this.resolveModelName(
                    op.getTitle(),
                    'inline_response_' + key
                  )
                  const model = this.modelFromProperty(op, modelName)
                  const existing = this.matchGenerated(model)
                  if (existing != null) {
                    response.setSchema(new RefProperty(existing))
                  } else {
                    response.setSchema(new RefProperty(modelName))
                    this.addGenerated(modelName, model)
                    swagger.addDefinition(modelName, model)
                  }
                }
              } else if (property instanceof ArrayProperty) {
                const ap = property
                const inner = ap.getItems()
                if (inner != null && inner instanceof ObjectProperty) {
                  const op: any = inner
                  if (hasProperties(op)) {
                    this.flattenProperties(op.getProperties(), pathname)
                    const modelName = this.resolveModelName(
                      op.getTitle(),
                      'inline_response_' + key
                    )
                    const innerModel = this.modelFromProperty(op, modelName)
                    const existing = this.matchGenerated(innerModel)
                    if (existing != null) {
                      ap.setItems(new RefProperty(existing))
                    } else {
                      ap.setItems(new RefProperty(modelName))
                      this.addGenerated(modelName, innerModel)
                      swagger.addDefinition(modelName, innerModel)
                    }
                  }
                }
              } else if (property instanceof MapProperty) {
                const mp = property
                const innerProperty = mp.getAdditionalProperties()
                if (
                  innerProperty != null &&
                  innerProperty instanceof ObjectProperty
                ) {
                  const op: any = innerProperty
                  if (hasProperties(op)) {
                    this.flattenProperties(op.getProperties(), pathname)
                    const modelName = this.resolveModelName(
                      op.getTitle(),
                      'inline_response_' + key
                    )
                    const innerModel = this.modelFromProperty(op, modelName)
                    const existing = this.matchGenerated(innerModel)
                    if (existing != null) {
                      mp.setAdditionalProperties(new RefProperty(existing))
                    } else {
                      mp.setAdditionalProperties(new RefProperty(modelName))
                      this.addGenerated(modelName, innerModel)
                      swagger.addDefinition(modelName, innerModel)
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    if (models != null) {
      for (const [modelName, model] of models) {
        if (model == null) {
          continue
        }
        if (model instanceof ModelImpl) {
          this.flattenProperties(model.getProperties(), modelName)
        } else if (model instanceof ArrayModel) {
          const m = model
          const inner = m.getItems()
          if (inner != null && inner instanceof ObjectProperty) {
            const op: any = inner
            if (isNotEmptySet(op.getProperties())) {
              const innerModelName = this.uniqueName(modelName + '_inner')
              const innerModel = this.modelFromProperty(op, innerModelName)
              const existing = this.matchGenerated(innerModel)
              if (existing == null) {
                swagger.addDefinition(innerModelName, innerModel)
                this.addGenerated(innerModelName, innerModel)
                m.setItems(new RefProperty(innerModelName))
              } else {
                m.setItems(new RefProperty(existing))
              }
            }
          }
        }
      }
    }
  }

  public resolveModelName(title, key) {
    if (title == null) {
      return this.uniqueName(key)
    } else {
      return this.uniqueName(title)
    }
  }

  public matchGenerated(model) {
    if (this.skipMatches) {
      return null
    }
    const json = Json.pretty(model)
    if (this.generatedSignature.containsKey(json)) {
      return this.generatedSignature.get(json)
    }
    return null
  }

  public addGenerated(name, model) {
    this.generatedSignature.put(Json.pretty(model), name)
  }

  public uniqueName(key) {
    let count = 0
    key = key.replace(new RegExp('[^a-z_\\.A-Z0-9 ]', 'g'), '')
    while (true) {
      let name = key
      if (count > 0) {
        name = key + '_' + count
      }
      if (this.swagger.getDefinitions() == null) {
        return name
      } else if (!this.swagger.getDefinitions().containsKey(name)) {
        return name
      }
      count += 1
    }
    return key
  }

  public flattenProperties(properties, path) {
    if (properties == null) {
      return
    }
    const propsToUpdate = newHashMap()
    const modelsToAdd = newHashMap()
    for (const [key, property] of properties) {
      if (property instanceof ObjectProperty && hasProperties(property)) {
        const modelName = this.uniqueName(path + '_' + key)
        const model = this.modelFromProperty(property, modelName)
        const existing = this.matchGenerated(model)
        if (existing != null) {
          propsToUpdate.put(key, new RefProperty(existing))
        } else {
          propsToUpdate.put(key, new RefProperty(modelName))
          modelsToAdd.put(modelName, model)
          this.addGenerated(modelName, model)
          this.swagger.addDefinition(modelName, model)
        }
      } else if (property instanceof ArrayProperty) {
        const ap = property
        const inner = ap.getItems()
        if (inner instanceof ObjectProperty) {
          const op: any = inner
          if (hasProperties(op)) {
            this.flattenProperties(op.getProperties(), path)
            const modelName = this.uniqueName(path + '_' + key)
            const innerModel = this.modelFromProperty(op, modelName)
            const existing = this.matchGenerated(innerModel)
            if (existing != null) {
              ap.setItems(new RefProperty(existing))
            } else {
              ap.setItems(new RefProperty(modelName))
              this.addGenerated(modelName, innerModel)
              this.swagger.addDefinition(modelName, innerModel)
            }
          }
        }
      } else if (property instanceof MapProperty) {
        const mp = property
        const inner = mp.getAdditionalProperties()
        if (inner != null && inner instanceof ObjectProperty) {
          const op: any = inner
          if (hasProperties(op)) {
            this.flattenProperties(op.getProperties(), path)
            const modelName = this.uniqueName(path + '_' + key)
            const innerModel = this.modelFromProperty(op, modelName)
            const existing = this.matchGenerated(innerModel)
            if (existing != null) {
              mp.setAdditionalProperties(new RefProperty(existing))
            } else {
              mp.setAdditionalProperties(new RefProperty(modelName))
              this.addGenerated(modelName, innerModel)
              this.swagger.addDefinition(modelName, innerModel)
            }
          }
        }
      }
    }
    if (isNotEmptySet(propsToUpdate)) {
      properties.putAll(propsToUpdate)
    }
    for (const [key, definition] of modelsToAdd) {
      this.swagger.addDefinition(key, definition)
      this.addedModels.put(key, definition)
    }
  }

  public modelFromProperty(object, path) {
    if (
      ((object != null && object instanceof ArrayProperty) ||
        object === null) &&
      (typeof path === 'string' || path === null)
    ) {
      const description = object.getDescription()
      let example = null
      const obj = object.getExample()
      if (obj != null) {
        example = obj.toString()
      }
      const inner = object.getItems()
      if (inner != null && inner instanceof ObjectProperty) {
        const model = new ArrayModel()
        model.setDescription(description)
        model.setExample(example)
        model.setItems(object.getItems())
        return model
      }
      return null
    } else if (
      ((object != null && object instanceof ObjectProperty) ||
        object === null) &&
      (typeof path === 'string' || path === null)
    ) {
      return this.modelFromProperty$io_swagger_models_properties_ObjectProperty$java_lang_String(
        object,
        path
      )
    } else if (
      ((object != null && object instanceof MapProperty) || object === null) &&
      (typeof path === 'string' || path === null)
    ) {
      return this.modelFromProperty$io_swagger_models_properties_MapProperty$java_lang_String(
        object,
        path
      )
    } else {
      throw new Error('invalid overload')
    }
  }

  public modelFromProperty$io_swagger_models_properties_ObjectProperty$java_lang_String(
    object,
    path
  ) {
    const description = object.getDescription()
    let example = null
    const obj = object.getExample()
    if (obj != null) {
      example = obj.toString()
    }
    const name = object.getName()
    const xml = object.getXml()
    const properties = object.getProperties()
    const model = new ModelImpl()
    model.setDescription(description)
    model.setExample(example)
    model.setName(name)
    model.setXml(xml)
    if (properties != null) {
      this.flattenProperties(properties, path)
      model.setProperties(properties)
    }
    return model
  }

  public modelFromProperty$io_swagger_models_properties_MapProperty$java_lang_String(
    object,
    path
  ) {
    const description = object.getDescription()
    let example = null
    const obj = object.getExample()
    if (obj != null) {
      example = obj.toString()
    }
    const model = new ArrayModel()
    model.setDescription(description)
    model.setExample(example)
    model.setItems(object.getAdditionalProperties())
    return model
  }

  public isSkipMatches() {
    return this.skipMatches
  }

  public setSkipMatches(skipMatches) {
    this.skipMatches = skipMatches
  }
}
