import {newHashMap, newHashSet} from '../java/javaUtil';
import {isNotEmpty} from '../java/StringUtils';

export function splitCommaSeparatedList(input) {
    const results = [];
    if (isNotEmpty(input))
        for (const value of input.split(",")) {
            if (isNotEmpty(value))
                results.push(value);
        }
    return results;
}

export function parseCommaSeparatedTuples(input) {
    let results = [];
    for (const tuple of splitCommaSeparatedList(input)) {
        const [name, value] =  tuple.split('=', 2);
        if (name != null && value != null) {
            results.push([name, value]);
        }
    }
    return results;
}


/**
 * Contains shared logic for applying key-value pairs and CSV strings
 * to specific settings in CodegenConfigurator.
 *
 * <p>
 * This class exists to facilitate testing. These methods could be applied
 * to CodegenConfigurator, but this complicates things when mocking CodegenConfigurator.
 * </p>
 */
export function applySystemPropertiesKvp(systemProperties, configurator) {
    for (const [key, value] of createMapFromKeyValuePairs(systemProperties)) {
        configurator.addSystemProperty(key, value);
    }
}

export function applyInstantiationTypesKvp(instantiationTypes, configurator) {
    for (const [key, value] of createMapFromKeyValuePairs(instantiationTypes)) {
        configurator.addInstantiationType(key, value);
    }
}

export function applyImportMappingsKvp(importMappings, configurator) {
    for (const [key, value] of createMapFromKeyValuePairs(importMappings)) {
        configurator.addImportMapping(key, value);
    }
}

export function applyTypeMappingsKvp(typeMappings, configurator) {
    for (const [key, value] of createMapFromKeyValuePairs(typeMappings)) {
        configurator.addTypeMapping(key, value);
    }
}

export function applyAdditionalPropertiesKvp(additionalProperties, configurator) {
    for (let [key, value] of createMapFromKeyValuePairs(additionalProperties)) {
        configurator.addAdditionalProperty(key, value);
    }
}

export function applyLanguageSpecificPrimitivesCsv(languageSpecificPrimitives, configurator) {
    for (const item of createSetFromCsvList(languageSpecificPrimitives)) {
        configurator.addLanguageSpecificPrimitive(item);
    }
}

export function createSetFromCsvList(csvProperty) {
    return newHashSet(...splitCommaSeparatedList(csvProperty));
}

export function createMapFromKeyValuePairs(commaSeparatedKVPairs) {
    return newHashMap(...parseCommaSeparatedTuples(commaSeparatedKVPairs));
}

export default ({
    applySystemPropertiesKvp,
    applyInstantiationTypesKvp,
    applyImportMappingsKvp,
    applyTypeMappingsKvp,
    applyAdditionalPropertiesKvp,
    applyLanguageSpecificPrimitivesCsv,
    createSetFromCsvList,
    createMapFromKeyValuePairs
})
