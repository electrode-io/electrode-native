import ArrayModel from "./models/ArrayModel";
import ModelImpl from "./models//ModelImpl";
import RefModel from "./models/RefModel";
import {BodyParameter, RefParameter} from "./models/parameters"; //= io.swagger.models.parameters.BodyParameter;
import {ArrayProperty, MapProperty, ObjectProperty, RefProperty} from "./models/properties";
import Json from "./java/Json";
import {newHashMap, isNotEmptySet} from "./java/javaUtil";
import LoggerFactory from "./java/LoggerFactory";


function hasProperties(obj) {
    if (obj == null) return false;
    return isNotEmptySet(obj.getProperties());
}

export default class InlineModelResolver {
    addedModels = newHashMap();
    generatedSignature = newHashMap();
    skipMatches = false;

    flatten(swagger) {
        this.swagger = swagger;
        if (swagger.getDefinitions() == null) {
            swagger.setDefinitions(newHashMap());
        }
        const paths = swagger.getPaths();
        const models = swagger.getDefinitions();
        if (paths != null) {
            for (const path of paths) {
                const pathname = path.path;
                for (const operation of path.getOperations()) {

                    const parameters = operation.getParameters();

                    if (isNotEmptySet(parameters)) {
                        for (const parameter of parameters) {

                            if (parameter != null && parameter instanceof BodyParameter) {
                                const bp = parameter;
                                if (bp.getSchema() != null) {
                                    let model = bp.getSchema();
                                    if (model != null && model instanceof ModelImpl) {
                                        let obj = model;
                                        if (obj.getType() == null || ("object" === obj.getType())) {
                                            if (isNotEmptySet(obj.getProperties())) {
                                                this.flattenProperties(obj.getProperties(), pathname);
                                                let modelName = this.resolveModelName(obj.getTitle(), bp.getName());
                                                bp.setSchema(new RefModel(modelName));
                                                this.addGenerated(modelName, model);
                                                swagger.addDefinition(modelName, model);
                                            }
                                        }
                                    }
                                    else if (model != null && model instanceof ArrayModel) {
                                        let am = model;
                                        let inner = am.getItems();
                                        if (inner != null && inner instanceof ObjectProperty) {
                                            let op = inner;
                                            if (isNotEmptySet(op.getProperties())) {
                                                this.flattenProperties(op.getProperties(), pathname);
                                                let modelName = this.resolveModelName(op.getTitle(), bp.getName());
                                                let innerModel = this.modelFromProperty(op, modelName);
                                                let existing = this.matchGenerated(innerModel);
                                                if (existing != null) {
                                                    am.setItems(new RefProperty(existing));
                                                }
                                                else {
                                                    am.setItems(new RefProperty(modelName));
                                                    this.addGenerated(modelName, innerModel);
                                                    swagger.addDefinition(modelName, innerModel);
                                                }
                                            }
                                        }
                                    }
                                }
                            } else if (parameter instanceof RefParameter) {
                                console.log('what the propertye?', parameter, operation);
                            }
                        }
                    }
                    const responses = operation.getResponses();
                    if (isNotEmptySet(responses)) {
                        for (const [key, response] of responses) {
                            const property = response.getSchema();
                            if (property == null)
                                continue;
                            if (property instanceof ObjectProperty) {
                                const op = property;
                                if (hasProperties(op)) {
                                    const modelName = this.resolveModelName(op.getTitle(), "inline_response_" + key);
                                    const model = this.modelFromProperty(op, modelName);
                                    const existing = this.matchGenerated(model);
                                    if (existing != null) {
                                        response.setSchema(new RefProperty(existing));
                                    }
                                    else {
                                        response.setSchema(new RefProperty(modelName));
                                        this.addGenerated(modelName, model);
                                        swagger.addDefinition(modelName, model);
                                    }
                                }
                            }
                            else if (property instanceof ArrayProperty) {
                                const ap = property;
                                const inner = ap.getItems();
                                if (inner != null && inner instanceof ObjectProperty) {
                                    const op = inner;
                                    if (hasProperties(op)) {
                                        this.flattenProperties(op.getProperties(), pathname);
                                        const modelName = this.resolveModelName(op.getTitle(), "inline_response_" + key);
                                        const innerModel = this.modelFromProperty(op, modelName);
                                        const existing = this.matchGenerated(innerModel);
                                        if (existing != null) {
                                            ap.setItems(new RefProperty(existing));
                                        }
                                        else {
                                            ap.setItems(new RefProperty(modelName));
                                            this.addGenerated(modelName, innerModel);
                                            swagger.addDefinition(modelName, innerModel);
                                        }
                                    }
                                }
                            }
                            else if (property instanceof MapProperty) {
                                const mp = property;
                                const innerProperty = mp.getAdditionalProperties();
                                if (innerProperty != null && innerProperty instanceof ObjectProperty) {
                                    const op = innerProperty;
                                    if (hasProperties(op)) {
                                        this.flattenProperties(op.getProperties(), pathname);
                                        const modelName = this.resolveModelName(op.getTitle(), "inline_response_" + key);
                                        const innerModel = this.modelFromProperty(op, modelName);
                                        const existing = this.matchGenerated(innerModel);
                                        if (existing != null) {
                                            mp.setAdditionalProperties(new RefProperty(existing));
                                        }
                                        else {
                                            mp.setAdditionalProperties(new RefProperty(modelName));
                                            this.addGenerated(modelName, innerModel);
                                            swagger.addDefinition(modelName, innerModel);
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
                if (model == null) continue;
                if (model instanceof ModelImpl) {
                    this.flattenProperties(model.getProperties(), modelName);
                }
                else if (model instanceof ArrayModel) {
                    let m = model;
                    let inner = m.getItems();
                    if (inner != null && inner instanceof ObjectProperty) {
                        let op = inner;
                        if (isNotEmptySet(op.getProperties())) {
                            let innerModelName = this.uniqueName(modelName + "_inner");
                            let innerModel = this.modelFromProperty(op, innerModelName);
                            let existing = this.matchGenerated(innerModel);
                            if (existing == null) {
                                swagger.addDefinition(innerModelName, innerModel);
                                this.addGenerated(innerModelName, innerModel);
                                m.setItems(new RefProperty(innerModelName));
                            }
                            else {
                                m.setItems(new RefProperty(existing));
                            }
                        }
                    }
                }
            }
        }
    }

    resolveModelName(title, key) {
        if (title == null) {
            return this.uniqueName(key);
        }
        else {
            return this.uniqueName(title);
        }
    }

    matchGenerated(model) {
        if (this.skipMatches) {
            return null;
        }
        const json = Json.pretty(model);
        if (this.generatedSignature.containsKey(json)) {
            return this.generatedSignature.get(json);
        }
        return null;
    }

    addGenerated(name, model) {
        this.generatedSignature.put(Json.pretty(model), name);
    }

    uniqueName(key) {
        let count = 0;
        let done = false;
        key = key.replace(new RegExp("[^a-z_\\.A-Z0-9 ]", 'g'), "");
        while ((!done)) {
            let name = key;
            if (count > 0) {
                name = key + "_" + count;
            }
            if (this.swagger.getDefinitions() == null) {
                return name;
            }
            else if (!this.swagger.getDefinitions().containsKey(name)) {
                return name;
            }
            count += 1;
        }
        return key;
    }

    flattenProperties(properties, path) {
        if (properties == null) {
            return;
        }
        const propsToUpdate = newHashMap();
        const modelsToAdd = newHashMap();
        for (const [key, property] of properties) {
            if (( property instanceof ObjectProperty) && hasProperties(property)) {
                const modelName = this.uniqueName(path + "_" + key);
                const model = this.modelFromProperty(property, modelName);
                const existing = this.matchGenerated(model);
                if (existing != null) {
                    propsToUpdate.put(key, new RefProperty(existing));
                }
                else {
                    propsToUpdate.put(key, new RefProperty(modelName));
                    modelsToAdd.put(modelName, model);
                    this.addGenerated(modelName, model);
                    this.swagger.addDefinition(modelName, model);
                }
            }
            else if (property instanceof ArrayProperty) {
                let ap = property;
                let inner = ap.getItems();
                if (inner instanceof ObjectProperty) {
                    let op = inner;
                    if (hasProperties(op)) {
                        this.flattenProperties(op.getProperties(), path);
                        const modelName = this.uniqueName(path + "_" + key);
                        const innerModel = this.modelFromProperty(op, modelName);
                        const existing = this.matchGenerated(innerModel);
                        if (existing != null) {
                            ap.setItems(new RefProperty(existing));
                        }
                        else {
                            ap.setItems(new RefProperty(modelName));
                            this.addGenerated(modelName, innerModel);
                            this.swagger.addDefinition(modelName, innerModel);
                        }
                    }
                }
            }
            else if (property instanceof MapProperty) {
                const mp = property;
                const inner = mp.getAdditionalProperties();
                if (inner != null && inner instanceof ObjectProperty) {
                    let op = inner;
                    if (hasProperties(op)) {
                        this.flattenProperties(op.getProperties(), path);
                        const modelName = this.uniqueName(path + "_" + key);
                        const innerModel = this.modelFromProperty(op, modelName);
                        const existing = this.matchGenerated(innerModel);
                        if (existing != null) {
                            mp.setAdditionalProperties(new RefProperty(existing));
                        }
                        else {
                            mp.setAdditionalProperties(new RefProperty(modelName));
                            this.addGenerated(modelName, innerModel);
                            this.swagger.addDefinition(modelName, innerModel);
                        }
                    }
                }
            }
        }
        if (isNotEmptySet(propsToUpdate)) {
            properties.putAll(propsToUpdate);
        }
        for (const [key, definition] of modelsToAdd) {
            this.swagger.addDefinition(key, definition);
            this.addedModels.put(key, definition);
        }
    }

    modelFromProperty(object, path) {
        if (((object != null && object instanceof ArrayProperty) || object === null) && ((typeof path === 'string') || path === null)) {
            let description = object.getDescription();
            let example = null;
            let obj = object.getExample();
            if (obj != null) {
                example = obj.toString();
            }
            let inner = object.getItems();
            if (inner != null && inner instanceof ObjectProperty) {
                let model = new ArrayModel();
                model.setDescription(description);
                model.setExample(example);
                model.setItems(object.getItems());
                return model;
            }
            return null;
        }
        else if (((object != null && object instanceof ObjectProperty) || object === null) && ((typeof path === 'string') || path === null)) {
            return this.modelFromProperty$io_swagger_models_properties_ObjectProperty$java_lang_String(object, path);
        }
        else if (((object != null && object instanceof MapProperty) || object === null) && ((typeof path === 'string') || path === null)) {
            return this.modelFromProperty$io_swagger_models_properties_MapProperty$java_lang_String(object, path);
        }
        else
            throw new Error('invalid overload');
    }

    modelFromProperty$io_swagger_models_properties_ObjectProperty$java_lang_String(object, path) {
        let description = object.getDescription();
        let example = null;
        let obj = object.getExample();
        if (obj != null) {
            example = obj.toString();
        }
        let name = object.getName();
        let xml = object.getXml();
        const properties = object.getProperties();
        const model = new ModelImpl();
        model.setDescription(description);
        model.setExample(example);
        model.setName(name);
        model.setXml(xml);
        if (properties != null) {
            this.flattenProperties(properties, path);
            model.setProperties(properties);
        }
        return model;
    }

    modelFromProperty$io_swagger_models_properties_MapProperty$java_lang_String(object, path) {
        let description = object.getDescription();
        let example = null;
        let obj = object.getExample();
        if (obj != null) {
            example = obj.toString();
        }
        const model = new ArrayModel();
        model.setDescription(description);
        model.setExample(example);
        model.setItems(object.getAdditionalProperties());
        return model;
    }

    isSkipMatches() {
        return this.skipMatches;
    }

    setSkipMatches(skipMatches) {
        this.skipMatches = skipMatches;
    }
}
const Log = LoggerFactory.getLogger(InlineModelResolver);
