import {newHashMap} from "../java/javaUtil";

export default class AbstractModel {
    vendorExtensions = newHashMap();

    getExternalDocs() {
        return this.externalDocs;
    };

    setExternalDocs(value) {
        this.externalDocs = value;
    };

    getTitle() {
        return this.title;
    };

    setTitle(title) {
        this.title = title;
    };

    getVendorExtensions() {
        return this.vendorExtensions;
    };

    setVendorExtension(name, value) {
        if (typeof name === 'string' && name.startsWith("x-")) {
            this.vendorExtensions.put(name, value);
        }
    };

    setVendorExtensions(vendorExtensions) {
        this.vendorExtensions = vendorExtensions;
    };


    getReference() {
        return this.reference;
    };

    setReference(reference) {
        this.reference = reference;
    };
}
