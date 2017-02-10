/**
 * ==============================================================================
 * Misc utilities
 * ==============================================================================
 * Given a string returns the same string with its first letter capitalized
 */
export function pascalCase(string) {
    return `${string.charAt(0).toUpperCase()}${string.slice(1)}`;
}
/**
 * true if the given type is a type array, false othewise
 */

export function isArrayType(type) {
    return type.includes('[]');
}
// List of currently schema supported primitive types
export const primitiveTypes = [
    "Boolean",
    "Integer",
    "Double",
    "Float",
    "String"
];

export function addIfModelObject(models, type) {
    if (type
        && !isArrayType(type)
        && !primitiveTypes.includes(type)) {
        models.add(type);
    }
}

export default async function (config, outFolder) {
    //
    // Common view (should be usefull stuff for Android/JS/iOS)
    const commonView = {
        // == Global ==
        // package is used for android but also for react-native-electrode-bridge
        // messages namespacing to avoid message naming collision between different
        // applications
        "package": `${config.namespace}.${config.apiName.toLowerCase()}`,
        // == Global ==
        // pascal cased api name. Useful for ex to generate class names starting
        // with the api name (by convention class names are pascal cased)
        "pascalCaseApiName": `${pascalCase(config.apiName)}`,
        // == Per event/request ==
        // pascal cased name (event name or request name)
        "pascalCaseName": function () {
            return pascalCase(this.name);
        },
        // == Global ==
        // Return an array of strings being all complex types names used in payloads
        // of events and requests (for example "LatLng", "Person" ...)
        // This can be used for multiple purposes. For Java generation it helps
        // to generate correct import statements to import model classes
        "models": function () {
            // todo : cache this somehow
            let models = new Set();
            for (let property in config) {
                if (config.hasOwnProperty(property)) {
                    if (property === 'events'
                        || property === 'requests') {
                        for (let item of config[property]) {
                            if (item.payload) {
                                addIfModelObject(models, item.payload.type)
                            }
                            addIfModelObject(models, item.respPayloadType)
                        }
                    }
                }
            }
            return Array.from(models);
        },
        // == Per event/request ==
        // True if this event has a payload
        // (might get renamed to hasEventPayload to different with requests)
        "hasPayload": function () {
            return this.payload !== undefined;
        },
        // == Per event/request ==
        // The name of the constant defining the message name
        // It is based on the event/request name
        // For example weatherUpdated event definition will result in the following
        // constant name identifying the message : WEATHER_UPDATED
        "constantName": function () {
            return this.name.replace(/([A-Z])/g, "_$1").toUpperCase()
        },
        // == Per event/request ==
        // The message name itself (as used by react-native-electrode-bridge)
        // It is based on the event/request name and prefixed by the package name
        // to avoid message naming collision
        // For example weatherUpdated event definition with a namespace being
        // 'com.mycompany' and an api name being 'foo', will result in the following
        // message name : "com.mycompany.foo.weather.updated"
        "bridgeMessageName": function () {
            return `${commonView.package}.${this.name.replace(/([A-Z])/g, ".$1")}`
                .toLowerCase()
        },
        // == Global ==
        // Used to generate the NPM module name, but also as the groupId for maven
        // publication in the JAVA generation case
        "moduleName": config.moduleName,
        // == Global ==
        // Generation output folder
        "outFolder": outFolder
    };

    // Build composite final mustache view
    return Promise.resolve(Object.assign({}, config, commonView));

}
