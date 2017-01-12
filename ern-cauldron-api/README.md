**PROTOTYPE/WIP**

**Table of Contents**

- [Cauldron Service](#cauldron-service)
  - [Usage](#usage)
  - [Technology Stack](#technology-stack)
  - [Cauldron Node.js client](#cauldron-nodejs-client)
  - [Cauldron REST API reference](#cauldron-rest-api-reference)
      - [Add a new native application](#add-a-new-native-application)
      - [Get all native applications](#get-all-native-applications)
      - [Get a single native application](#get-a-single-native-application)
      - [Remove a native application](#remove-a-native-application)
      - [Add a platform](#add-a-platform)
      - [Get all platforms](#get-all-platforms)
      - [Get a single platform](#get-a-single-platform)
      - [Remove a platform](#remove-a-platform)
      - [Add a version](#add-a-version)
      - [Patch version release status](#patch-version-release-status)
      - [Get all versions](#get-all-versions)
      - [Get a single version](#get-a-single-version)
      - [Remove a version](#remove-a-version)
      - [Add a native dependency](#add-a-native-dependency)
      - [Get all native dependencies](#get-all-native-dependencies)
      - [Get a single native dependency](#get-a-single-native-dependency)
      - [Patch a native dependency version](#patch-a-native-dependency-version)
      - [Remove a native dependency](#remove-a-native-dependency)
      - [Add a react native application](#add-a-react-native-application)
      - [Get all react native applications](#get-all-react-native-applications)
      - [Get a single react native application](#get-a-single-react-native-application)
      - [Remove a react native application](#remove-a-react-native-application)
      - [Add a native application binary](#add-a-native-application-binary)
      - [Get a native application binary](#get-a-native-application-binary)
      - [Remove a native application binary](#remove-a-native-application-binary)
      - [Add a react native application sourcemap](#add-a-react-native-application-sourcemap)
      - [Get a react native application sourcemap](#get-a-react-native-application-sourcemap)
      - [Remove a react native application sourcemap](#remove-a-react-native-application-sourcemap)
  - [JSON document sample](#json-document-sample)

# Cauldron Service

The Cauldron is the center piece of the electrode react native platform.  

As initially envisioned, the Cauldron scope was limited to tracking react native "binary" dependencies contained within a native app, for purposes mostly related to the OTA update platform (based on CodePush).  
Given this vision, the Cauldron usage scope is limited to somehow being a gatekeeper when it comes to publishing OTA updates, ensuring updates can only be pushed to binary compatible native app version(s).  

The Cauldron depicted here is more than just that.  

Indeed, not only does it catalogs the react native binary dependencies contained within a given native application, it also catalogs additional data related to native applications and react native applications, useful for other parts of the platform.  

For example, in addition to storing react native binary dependencies contained within a native application platform and version, it also stores the binaries of the native application (APP for iOS, APK for Android). These binaries are of great use for the react native application development team(s) when it comes to try out and test their react native app(s) within the native host application. Additionally, in this current draft, the Cauldron can also store the source-map of each react native application version, very useful when it comes to crash reporting, to figure out the LOC of the crash in the original source code.

In this early prototype, the cauldron rest API embraces KISS & YAGNI principles. For that reason, there is no database (not even NOSQL ... NO NOSQL !) to contain the cauldron data. Instead, we use a single JSON document to hold text based data and additional files to contain associated binary data (see reference sample document).

When it comes to storing information, the "atom" or "unit" of the cauldron in the current drafted data structure is the combination of native application name/platform/version. For example `walmart/android/4.1` or `walmart/ios/7.0`. A combination app/platform/version is unique. This can be easily visualized as a tree data structure (see ASCII representation below) and will be internally stored this way.

```
├── Walmart
│   ├── Android   
│   │   ├── 4.1 --> Holds the data for this specific app/platform/version unique combination
│   │   ├── 4.2
│   ├── iOS   
│   │   ├── 7.0  
│   │   ├── 7.1
```

The Cauldron is exposed to the outside world as an HTTP REST API service that can be used to retrieve data from it, or add data to it. This REST API is documented below.  
Even though direct access through the REST API is possible, clients are encouraged to rather use the `electrode-react-native` (WIP, more info [HERE](https://gecgithub01.walmart.com/blemair/react-native-platform-draft)) command line tool to access the Cauldron. This tool gives access to the whole API surface in a more simpler to use way, but also adds a lot of helpful commands on top of it, all based one way or another on the knowledge held by the Cauldron. Initial draft for this tool along with more details can be found at the end of this document.

It is also important to state that the Cauldron API does not have any strong enforcement business logic. It is just doing what it is asked to do. For example, making sure that a react native application is binary compatible with a given native application platform and version is not the responsibility of the Cauldron itself, but rather the responsibility of tools (electrode-react-native being one example) based upon the Cauldron.

## Usage

Here are the two current options to run the Cauldron service locally on your workstation

### From source (recommended if you want to contribute back to this project)

1. Clone this repository
2. `npm install`
3. `npm start`

You can then issue requests to the Cauldron listening on `http://localhost:3000`  

If you plan on contributing back to this project, please make sure to run test suite via `npm test` before issuing a pull request.  
All tests should pass and line/branch coverage of the project should remain at 100%.  

For convenience, a [Postman](https://www.getpostman.com/) requests collection covering the whole API surface is included in this project in the [postman](/postman) folder.

### Inside a Docker container

A Dockerfile is present in this project so that a docker image can be built out of it.  
The docker image is not available publically at this time, so you'll need to first build it

`docker build -t <username>/cauldron-api .`

Then you can run it in a container (locally or in your favorite cloud hosting docker containers)

`docker run -p 3000:3000 -d <username>/cauldron-api`

## Technology Stack

- **Runtime / Language** : Node 6 / ES6 (using babel / babel-preset-node6)  
- **Server Framework** : Hapi  
- **Schema / Validation Framework** : Joi  
- **Utitily toolbelt** : lodash   
- **Testing** : mocha / chai / chai-http
- **Test Coverage** : istanbul / isparta  

## Cauldron NodeJs client

If you need to access the Cauldron from your node project, you can use the [cauldron-cli](https://gecgithub01.walmart.com/Electrode-Mobile-Platform/cauldron-cli) module.   

## Cauldron REST API reference

#### Add a new native application

`POST http://api.cauldron.io/nativeapps`

> Sample request

```http
POST /nativeapps HTTP/1.1
Content-Type: application/json
Accept: application/json

{
  "name": "walmart"
}
```

Parameter | Mandatory | Default | Description
--------- | ------- | ----------- | ---------
name | YES | | The name of the native application to create
platforms | NO | [ ] | An array of platforms

#### Get all native applications

`GET http://api.cauldron.io/nativeapps`

> Sample request

```http
GET /nativeapps HTTP/1.1
Accept: application/json
```

> Sample JSON output

```json
{
  "name": "walmart",
  "platforms": []
}
```

#### Get a single native application

`GET http://api.cauldron.io/nativeapps/{app}`

> Sample request

```http
GET /nativeapps/walmart HTTP/1.1
Accept: application/json
```

#### Remove a native application

`DELETE http://api.cauldron.io/nativeapps/{app}`

> Sample request

```http
DELETE /nativeapps/walmart HTTP/1.1
```

#### Add a platform

`POST http://api.cauldron.io/nativeapps/{app}/platforms`

> Sample request

```http
POST /nativeapps/walmart/platforms HTTP/1.1
Content-Type: application/json
Accept: application/json

{
  "name": "android"
}
```

Parameter | Mandatory | Default | Description
--------- | ------- | ------ | -----------
name | YES | The name of the platform to add to the native application (only 'android' and 'ios' are supported at the moment)
versions | NO | An array of versions

#### Get all platforms

`GET http://api.cauldron.io/nativeapps/{app}/platforms`

> Sample request

```http
GET /nativeapps/walmart/platforms HTTP/1.1
Accept: application/json
```

> Sample JSON output

```json
[
  {
    "name": "android",
    "versions": []
  }
]
```

#### Get a single platform

`GET http://api.cauldron.io/nativeapps/{app}/platforms/{platform}`

> Sample request

```http
GET /nativeapps/walmart/platforms/android HTTP/1.1
Accept: application/json
```

#### Remove a platform

`DELETE http://api.cauldron.io/nativeapps/{app}/platforms/{platform}`

> Sample request

```http
DELETE /nativeapps/walmart/platforms/android HTTP/1.1
```

#### Add a version

`POST http://api.cauldron.io/nativeapps/{app}/platforms/{platform}/versions`

> Sample request

```http
POST /nativeapps/walmart/platforms/android/versions HTTP/1.1
Content-Type: application/json
Accept: application/json

{
  "name": "4.1"
}
```

Parameter | Mandatory | Default | Description
--------- | ------- | -----------|----
name | YES | | The version to add for this native application platform
isReleased | NO | false | true if this version was released, false otherwise
nativedeps | NO | [ ] | An array of native dependencies part of this version / platform
reactnativeapps | NO | [ ] | An array of react native apps part of this version / platform

#### Patch version release status

`PATCH  http://api.cauldron.io/nativeapps/{app}/platforms/{platform}/versions/{version}`

> Sample request

```http
POST /nativeapps/walmart/platforms/android/versions HTTP/1.1
Content-Type: application/json
Accept: application/json

{
  "isReleased": true
}
```

Parameter | Mandatory | Default | Description
--------- | ------- | -----------|----
isReleased | NO | false | true if this version was released, false otherwise

#### Get all versions

`GET http://api.cauldron.io/nativeapps/{app}/platforms/{platform}/versions`

> Sample request

```http
GET /nativeapps/walmart/platforms/android/versions HTTP/1.1
Accept: application/json
```

> Sample JSON output

```json
[
  {
    "name": "4.1",
    "released": false,
    "nativedeps": [],
    "reactnativeapps": []
  }
]
```

#### Get a single version

`GET http://api.cauldron.io/nativeapps/{app}/platforms/{platform}`

> Sample request

```http
GET /nativeapps/walmart/platforms/android HTTP/1.1
Accept: application/json
```

#### Remove a version

`DELETE http://api.cauldron.io/nativeapps/{app}/platforms/{platform}/versions/{version}`

> Sample request

```http
DELETE /nativeapps/walmart/platforms/android/versions/4.1 HTTP/1.1
```

#### Add a native dependency

`POST http://api.cauldron.io/nativeapps/{app}/platforms/{platform}/versions/{version}/nativedeps`

> Sample request

```http
POST /nativeapps/walmart/platforms/android/versions/4.1/nativedeps HTTP/1.1
Content-Type: application/json
Accept: application/json

{
  "name": "react-native",
  "version": "0.32.0"
}
```

Parameter | Mandatory | Description
--------- | ------- | -----------
name | YES | The name of the native dependency
version | YES | The version of the native dependency

#### Get all native dependencies

`GET http://api.cauldron.io/nativeapps/{app}/platforms/{platform}/versions/{version}/nativedeps`

> Sample request

```http
GET /nativeapps/walmart/platforms/android/versions/4.1/nativedeps HTTP/1.1
Accept: application/json
```

> Sample JSON output

```json
[
  {
    "name": "react-native",
    "version": "0.32.0"
  }
]
```

#### Get a single native dependency

`GET http://api.cauldron.io/nativeapps/{app}/platforms/{platform}/versions/{version}/nativedeps/{nativedep}`

> Sample request

```http
GET /nativeapps/walmart/platforms/android/versions/4.2/nativedeps/react-native HTTP/1.1
Accept: application/json
```

#### Patch a native dependency version

`PATH http://api.cauldron.io/nativeapps/{app}/platforms/{platform}/versions/{version}/nativedeps/{nativedep}`

> Sample request

```http
POST /nativeapps/walmart/platforms/android/versions/4.1/nativedeps/react-native HTTP/1.1
Content-Type: application/json
Accept: application/json

{
  "version": "0.34.0"
}
```

Parameter | Mandatory | Description
--------- | ------- | -----------
version | NO | The new version of the native dependency

#### Remove a native dependency

`DELETE http://api.cauldron.io/nativeapps/{app}/platforms/{platform}/versions/{version}/nativedeps/{nativedep}`

> Sample request

```http
DELETE /nativeapps/walmart/platforms/android/versions/4.1/nativedeps/react-native HTTP/1.1
```

#### Add a react native application

`POST http://api.cauldron.io/nativeapps/{app}/platforms/{platform}/versions/{version}/reactnativeapps`

> Sample request

```http
POST /nativeapps/walmart/platforms/android/versions/4.1/reactnativeapps HTTP/1.1
Content-Type: application/json
Accept: application/json

{
  "name": "react-native-cart",
  "version": "1.2.3"
}
```

Parameter | Mandatory Description
--------- | ------- |-----------
name | YES | The name of the react native app
version | YES | The version of the react native app

#### Get all react native applications

`GET http://api.cauldron.io/nativeapps/{app}/platforms/{platform}/versions/{version}/reactnativeapps`

> Sample request

```http
GET /nativeapps/walmart/platforms/android/versions/4.1/reactnativeapps HTTP/1.1
Accept: application/json
```

> Sample JSON output

```json
[
  {
    "name": "react-native-cart",
    "version": "1.2.3"
  }
]
```

#### Get a single react native application

`GET http://api.cauldron.io/nativeapps/{app}/platforms/{platform}/versions/{version}/reactnativeapps/{reactnativeapp}`

> Sample request

```http
GET /nativeapps/walmart/platforms/android/versions/4.2/reactnativeapps/react-native-cart HTTP/1.1
Accept: application/json
```

#### Remove a react native application

`DELETE http://api.cauldron.io/nativeapps/{app}/platforms/{platform}/versions/{version}/reactnativeapps/{reactnativeapp}`

> Sample request

```http
DELETE /nativeapps/walmart/platforms/android/versions/4.1/reactnativeapps/react-native-cart HTTP/1.1
```

> Sample JSON output

```json
[
  {
    "name": "react-native-cart",
    "version": "1.0.1",
    "isInBinary": true
  },
  {
    "name": "react-native-cart",
    "version": "1.0.2",
    "isInBinary": false
  }
]
```

#### Add a native application binary

`POST http://api.cauldron.io/nativeapps/{app}/platforms/{platform}/versions/{version}/binary`

> Sample request

```http
POST /nativeapps/walmart/platforms/android/versions/4.1/binary HTTP/1.1
Content-Type: application/octet-stream
```

The payload of this request should be the binary data of the native application binary.

#### Get a native application binary

`GET http://api.cauldron.io/nativeapps/{app}/platforms/{platform}/versions/{version}/binary`

> Sample request

```http
GET /nativeapps/walmart/platforms/android/versions/4.1/binary HTTP/1.1
```

Native application binary is returned as the payload of the body.

#### Remove a native application binary

`DELETE http://api.cauldron.io/nativeapps/{app}/platforms/{platform}/versions/{version}/binary`

> Sample request

```http
DELETE /nativeapps/walmart/platforms/android/versions/4.1/binary HTTP/1.1
```

#### Add a react native application sourcemap

`POST http://api.cauldron.io/reactnativeapps/{app}/versions/{version}/sourcemap`

> Sample request

```http
POST /reactnativeapps/react-native-cart/versions/1.2.3/sourcemap HTTP/1.1
Content-Type: application/octet-stream
```

The payload of this request should be the binary data of the source map.

#### Get a react native application sourcemap

`GET http://api.cauldron.io/reactnativeapps/{app}/versions/{version}/sourcemap`

> Sample request

```http
GET /reactnativeapps/react-native-cart/versions/1.2.3/sourcemap HTTP/1.1
```

Native application binary is returned as the payload of the body.

#### Remove a react native application sourcemap

`DELETE http://api.cauldron.io/reactnativeapps/{app}/versions/{version}/sourcemap`

> Sample request

```http
DELETE /reactnativeapps/react-native-cart/versions/1.2.3/sourcemap HTTP/1.1
```

## JSON document sample

The following JSON is a sample document representing the internal structure of the cauldron data.

```json
{
  "nativeapps": [
    {
      "name": "walmart",
      "platforms": [
        {
          "name": "android",
          "versions": [
            {
              "name": "4.1",
              "released": false,
              "binary": "cf23df2207d99a74fbe169e3eba035e633b65d94",
              "nativedeps": [
                {
                  "name": "react-native",
                  "version": "0.32.0"
                },
                {
                  "name": "react-native-electrode-core",
                  "version": "0.17.1"
                }
              ],
              "reactnativeapps": [
                {
                  "name": "react-native-cart",
                  "version": "1.0.1",
                  "isInBinary": true,
                  "published": 1473807075
                },
                {
                  "name": "react-native-cart",
                  "version": "1.0.2",
                  "isInBinary": false,
                  "published": 1473817076
                }
              ]
            }
          ]
        },
        {
          "name": "ios",
          "versions": [
            {
              "name": "7.0",
              "released": true,
              "binary": "cf23df2207d99a74fbe169e3eba035e633b65d44",
              "nativedeps": [
                {
                  "name": "react-native",
                  "version": "0.32.0"
                },
                {
                  "name": "react-native-electrode-core",
                  "version": "0.19.0"
                }
              ],
              "reactnativeapps": [
                {
                  "name": "react-native-cart",
                  "version": "2.0.1",
                  "in-binary": true,
                  "published": 1473817077
                },
                {
                  "name": "react-native-cart",
                  "version": "2.0.2",
                  "in-binary": false,
                  "published": 1473817088
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```
