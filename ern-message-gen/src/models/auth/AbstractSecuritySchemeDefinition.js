import {newHashMap} from "../../java/javaUtil";

export default class AbstractSecuritySchemeDefinition {
    vendorExtensions = newHashMap();

    getVendorExtensions() {
        return this.vendorExtensions;
    };
    getType() {
        return this.type;
    };

    setType(type) {
        this.type = type;
    };
    setVendorExtension(name, value) {
        if (name.startsWith("x-")) {
            this.vendorExtensions.put(name, value);
        }
    };

    setVendorExtensions(vendorExtensions) {
        this.vendorExtensions = vendorExtensions;
    };

    getDescription() {
        return this.description;
    };

    setDescription(description) {
        this.description = description;
    }

    toJSON() {
        return {
            description: this.description,
            vendorExtensions: this.vendorExtensions,
        }
    }
}
