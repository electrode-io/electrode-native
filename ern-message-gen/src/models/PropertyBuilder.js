import {resolve, factory} from "./factory";
import ModelImpl from "./ModelImpl";
import ArrayModel from "./ArrayModel";
import RefModel from "./RefModel";
import ComposedModel from './ComposedModel';
import {apply} from "../java/beanUtils";
import {ArrayProperty, RefProperty} from "./properties";
import LoggerFactory from "../java/LoggerFactory";
const Log = LoggerFactory.getLogger(`PropertyBuilder`);

export function build(type, format, args) {

    const prop = {type, format};
    if (args) {
        for (const [k, v] of args) {
            prop[k] = v;
        }
    }
    const property = factory(prop);
    if (property == null) {
        Log.error(`could not find property for type ${type} ${format}`);
    }
    return property;
}

export function toModel(property, parent) {
    if (property == null || property instanceof ArrayModel || property instanceof RefModel || property instanceof ModelImpl) {
        return property;
    }
    property = factory(property);

    const {allowedProps} = property.constructor;
    let model;
    if (property.allOf) {
        model = new ComposedModel();
        const interfaces = property.allOf.filter(withRef);
        const child = property.allOf.filter(withOutRef);

        model.parent(parent).child(toModel(child.shift(), model));
        model.setInterfaces(interfaces.map((c) => toModel(c, model)));
        if (child.length) {
            Log.warn(`An allOf can only have 1 implementation, it can have multiple $ref types`)
        }
    } else if (property instanceof ArrayProperty) {
        model = new ArrayModel();
    } else if (property instanceof RefProperty) {
        model = new RefModel();

    } else {
        model = new ModelImpl();
    }

    apply(model, property, [...allowedProps, "externalDocs"]);

    return model;

}
const withOutRef = ({$ref}) => !$ref
const withRef = ({$ref}) => $ref
export default ({
    build,
    toModel
});
