import AbstractModel from './AbstractModel';
import factory from './factory';
import {asMap} from '../java/javaUtil';
import {apply} from '../java/beanUtils';

export default class ArrayModel extends AbstractModel {
    type = "array";

    description(description) {
        this.setDescription(description);
        return this;
    };

    items(items) {
        this.setItems(items);
        return this;
    };

    minItems(minItems) {
        this.setMinItems(minItems);
        return this;
    };

    maxItems(maxItems) {
        this.setMaxItems(maxItems);
        return this;
    };

    getType() {
        return this.type;
    };

    setType(type) {
        this.type = type;
    };

    getDescription() {
        return this.__description;
    };

    setDescription(description) {
        this.__description = description;
    };

    getItems() {
        return this.__items;
    };

    setItems(items) {
        this.__items = factory(items);
    };

    getProperties() {
        return this.properties;
    };

    setProperties(properties) {
        this.properties = asMap(properties);
    };

    getExample() {
        return this.example;
    };

    setExample(example) {
        this.example = example;
    };

    getMinItems() {
        return this.__minItems;
    };

    setMinItems(minItems) {
        this.__minItems = minItems;
    };

    getMaxItems() {
        return this.__maxItems;
    };

    setMaxItems(maxItems) {
        this.__maxItems = maxItems;
    };


    clone() {
        return apply(new this.constructor(), this);
    };

}