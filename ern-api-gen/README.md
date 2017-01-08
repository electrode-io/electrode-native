## ERN API Generator

**!! Only supports Android/JS generation as of now !!**

This project can be used either as a standalone binary `ern-apigen` that can be launched from the command line, or it can be imported as a node module in another node project ([electrode-react-native](https://gecgithub01.walmart.com/Electrode-Mobile-Platform/electrode-react-native) is using it this way).

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


##### Project Structure

`api-hull` folder contains the base skeleton for an API lib, be it for Android/iOS or JS.  
`templates` folder contains api generation code templates for all platforms.

##### To run it &&|| work on it

1) `git clone` this repo  
2) Run `npm install`  
3) Run `npm link` to make `ern-libgen` binary invocable globally  
4) From within a folder on your machine, create a file named `apigen.schema` and copy/paste the sample schema provided above (representing a somewhat stupid weather api)  
5) From within the same folder run `ern-libgen` in your terminal

You should then see the following output in your terminal :
```
[apigen] == Patching Hull
[apigen] == Generating API code
[apigen] Generating react-native-weather-api-generated/android/lib/src/main/java/com/walmartlabs/ern/weather/api/WeatherApiClient.java
[apigen] Generating react-native-weather-api-generated/android/lib/src/main/java/com/walmartlabs/ern/weather/api/WeatherApi.java
[apigen] Generating react-native-weather-api-generated/android/lib/src/main/java/com/walmartlabs/ern/weather/api/Names.java
[apigen] Generating react-native-weather-api-generated/js/apiClient.js
[apigen] Generating react-native-weather-api-generated/js/api.js
[apigen] Generating react-native-weather-api-generated/js/messages.js
[apigen] == Generation completed
```

Generation of the API module based on the provided schema is complete, it should have created a folder `react-native-weather-api-generated` container the generated NPM module, with the following current tree structure :


```
react-native-weather-api-generated
├── README.md
├── android
│   ├── build.gradle
│   ├── gradle
│   │   └── wrapper
│   │       ├── gradle-wrapper.jar
│   │       └── gradle-wrapper.properties
│   ├── gradlew
│   ├── lib
│   │   ├── build.gradle
│   │   └── src
│   │       └── main
│   │           ├── AndroidManifest.xml
│   │           └── java
│   │               └── com
│   │                   └── walmartlabs
│   │                       └── ern
│   │                           └── weather
│   │                               ├── api
│   │                               │   ├── WeatherApi.java
│   │                               │   ├── WeaherApiClient.java
│   │                               │   └── Names.java
│   │                               └── model
│   │                                   └── LatLng.java
│   └── settings.gradle
├── index.js
├── ios
│   └── README.md
├── js
│   ├── README.md
│   ├── api.js
│   ├── apiClient.js
│   └── messages.js
└── package.json
```
