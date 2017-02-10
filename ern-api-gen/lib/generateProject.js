import path from 'path';
import {writeFile} from './fileUtil';
import {
    SCHEMA_FILE,
    PKG_FILE,
    MODEL_FILE
} from './Constants';


export function generatePackageJson({
    npmScope,
    moduleName,
    reactNativeVersion,
    apiVersion = '1.0.0', apiDescription, apiAuthor, apiLicense, bridgeVersion
}) {
    return JSON.stringify({
        "name": npmScope ? `${npmScope}@${moduleName}` : moduleName,
        "version": apiVersion,
        "description": apiDescription,
        "main": "index.js",
        "author": apiAuthor,
        "license": apiLicense,
        "scripts": {
            "regen": "ern generate api regen .",
            "preinstall": "ern generate api regen ."
        },
        "dependencies": {
            "@walmart/react-native-electrode-bridge": bridgeVersion,
            'react-native': reactNativeVersion
        }
    }, null, 2);
}

export function generateInitialSchema({namespace}) {

    return `namespace ${namespace}
// Event with no payload
event weatherUpdated

// Event with a primitive type payload
event weatherUpdatedAtLocation(location: String)

// Event with complex type payload
event weatherUpdatedAtPosition(position: LatLng)

// Request with no request payload and no response payload
request refreshWeather()
`
}

export function generateInitialModel() {
    return JSON.stringify({
        type: "Object",
        name: "LatLng",
        properties: {
            "lat": {
                "type": "number"
            },
            "lng": {
                "type": "number"
            },
            "name": {
                "type": "string"
            }
        }
    }, null, 2);
}

export default async function generateProject(config, outFolder) {
    await writeFile(path.join(outFolder, PKG_FILE), generatePackageJson(config));
    await writeFile(path.join(outFolder, SCHEMA_FILE), generateInitialSchema(config));
    await writeFile(path.join(outFolder, MODEL_FILE), generateInitialModel(config));
}
