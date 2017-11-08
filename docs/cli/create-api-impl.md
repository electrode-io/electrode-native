## `ern create-api-impl`

#### Description

* Create an implementation skeleton project for a specified API  
**Note** This command does not require that you are the author of the API that you are planning to implement, but it requires that the API has been created first.  

#### Syntax

`ern create-api-impl <apiName> [apiImplName]`  

**Arguments**

`<apiName>`

* The package descriptor of the API for which to create an API implementation project

`[apiImplName]`
* The name of the API implementation project.  The API implementation name must follow Electrode Native module name rules.
* If name of the apiImpl is missing the apiName is converted to came case notation and numbers are removed if any.

**Options**  

`--nativeOnly/-n`

* Generate an implementation skeleton project for a native implementation of the API  

`--jsOnly/-j`

* Generate an implementation skeleton project for a JavaScript implementation of the API
  
`--packageName/-p`
* Specify the NPM package name to use for the API implementation.
* Add the package name automatically in the `package.json` of the generated API implementation.
* **Default** The command will prompt for the package name to use.

`--scope/-s`
* Specify the NPM package scope to use for the API implementation.
* Add the package scope automatically in the `package.json` of the generated API implementation.
* **Default** Package will be unscoped.

`--outputDirectory/-o <directory>`

* Generate the project in a specified output directory  
* **Default**  The project is generated in a new directory named as the API implementation project. The new directory is created in the current working directory.  

`--hasConfig`
* Indicates if this api implementation requires some config during initialization.
* This option will be stored and reused during container generation to enforce config initialization

`--skipNpmCheck`
* Skip the check ensuring package does not already exists in NPM registry
* **Default** The value defaults to false. 

`--force/-f`

* Force the creation of an API implementation project  
* **Caution**  If there is already an implementation project in the target directory, the new project will overwrite the existing project completely. Use this option only if you are sure that you can overwrite any existing project.  

#### Examples

`ern create-api-impl react-native-weather-api`

This example shows how to create an API skeleton project named `ReactNativeWeatherApiImpl`.

`ern create-api-impl react-native-weather-api MyApi`

This example shows how to create an API skeleton project named `MyApi`.

`ern create-api-impl react-native-weather-api MyApi -p my-weather-api-impl`

This example shows how to create an API skeleton project named `MyApi`.
The package name for this project is `my-weather-api-impl`.

`ern create-api-impl react-native-weather-api MyApi -p my-weather-api-impl -s org`

This example shows how to create an API skeleton project named `MyApi`.
The package name for this project is `@org/my-weather-api-impl`.

#### Remarks

* If name of the apiImpl is missing the apiName is converted to came case notation and numbers are removed if any.  
* If you do not specify a platform (for example, native v.s JavaScript), you are prompted to select a platform.    

#### Related commands

[ern create-api] | Create an API


[ern create-api]: ./create-api.md