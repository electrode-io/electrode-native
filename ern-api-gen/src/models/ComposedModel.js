import AbstractModel from './AbstractModel';
import {apply} from '../java/javaUtil';

export default class ComposedModel extends AbstractModel {
    allOf = [];

    parent(model) {
        this.setParent(model);
        return this;
    };

    child(model) {
        this.setChild(model);
        return this;
    };

    interfaces(interfaces) {
        this.setInterfaces(interfaces);
        return this;
    };

    getDescription() {
        return this.description;
    };

    setDescription(description) {
        this.description = description;
    };

    getProperties() {
        return null;
    };

    setProperties(properties) {
    };

    getExample() {
        return this.example;
    };

    setExample(example) {
        this.example = example;
    };

    getAllOf() {
        return this.allOf;
    };

    setAllOf(allOf) {
        this.allOf = allOf;
    };

    getParent() {
        return this.__parent;
    };

    setParent(model) {
        this.__parent = model;
        if (this.allOf.indexOf(model) === -1) {
            this.allOf.push(model);
        }
    };

    getChild() {
        return this.__child;
    };

    setChild(model) {
        this.__child = model;
        if (this.allOf.indexOf(model) === -1) {
            this.allOf.push(model);
        }
    };

    getInterfaces() {
        return this.__interfaces;
    };

    setInterfaces(interfaces) {
        this.__interfaces = interfaces;
        for (const model of interfaces) {
            if (this.allOf.indexOf(model) === -1) {
                this.allOf.push(model);
            }
        }
    };

    clone() {
        return apply(new this.constructor, this);
    }
}
