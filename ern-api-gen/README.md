## ERN API Generator

**!! Only supports Android/JS generation as of now !!**

This project can be used either as a standalone binary `ern-apigen` that can be launched from the command line, or it can be imported as a node module in another node project ([ern-local-cli](../ern-local-cli) is consuming it this way).

This project is making use of [mustache](https://mustache.github.io/) for templating needs.

It can be used to generate complete API & API Client code from a simple schema (or config).
API/APIClient code is wrapping all calls to `react-native-electrode-bridge` and offer clean typed (Android/iOS) methods to either consume or implement the API.  
Produced code is packaged in an npm module containing the Android/IOS and JS code. It has somehow a structure similar to any other react-native plugin.  

##### I/O

**Inputs**

Inputs are still WIP and subject to heavy changes in the way they are provided, but for now inputs can be either part of a config file or a schema. The schema will be converted to a config, so the basic unit of
input is a config.

Base config parameters :

| Name         | Description       | Required    | Default Value
|:----------:|:-------------:|:-------------:|:-------------:|
| namespace | The namespace/groupid to use for generated API| YES |  |
| npmscope | NPM scope to use for publication | NO | No scope |
| apiname | The name of the API | YES | |
| apiversion | The version of the API | YES | |
| bridgeversion | The version of the bridge to use | YES | | |

As of now the API generator looks for a file named `apigen.schema` in the working folder where the command is launched. The file represents the schema defining the API and is used during generation.

Here is an example of such a schema. Ultimately schema should also contains message types (data types) as the api generator will also probably take care of calling the message generator to fully generate the API including data types.

```
namespace com.walmartlabs.ern
npmscope walmart
apiname weather
bridgeversion 1.0.3
apiversion 0.0.5

// Event with no payload
event weatherUpdated

// Event with a primitive type payload
event weatherUdpatedAtLocation(location: String)

// Event with complex type payload
event weatherUpdatedAtPosition(position: LatLng)

// Request with no request payload and no response payload
request refreshWeather()

// Request with a single request payload and no response payload
request refreshWeatherFor(location: String)

// Request with a single request payload and a response payload
request getTemperatureFor(location: String) : Integer

// Request with no request payload and a response payload
request getCurrentTemperature() : Integer
```

`event` generation support is complete.
`request` generation support is partial (sufficient for demo app needs).
(Multi param request support is missing)


Generated code somehow reflect what has been proposed on the wiki :  
[Messages-API-generation-proposal](https://gecgithub01.walmart.com/Electrode-Mobile-Platform/site/wiki/Messages-API-generation-proposal)

The [sample](./sample) folder let you see what gets generated based on a sample schema.

##### Project Structure

`api-hull` folder contains the base skeleton for an API lib, be it for Android/iOS or JS.  
`templates` folder contains api generation code templates for all platforms.

##### Current suggested development procedure

If you need to add new support or modify existing generating code, on Android a good way is to load the sample project in Android Studio and work from there to modify the Android code the way you would like the generated output to be.   
Then once you are satisfied and you ensure it compiles fine, you can backtrack from there and work on the template itself to produce the desired code.  
You can then run the generator and make sure produced code is correct by reloading the sample project in Android Studio and launching a new build.
