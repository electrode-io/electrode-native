## `ern create-api-impl`

#### Description

* Create an implementation skeleton project for a specified API  
**Note** This command does not require that you are the author of the API that you are planning to implement, but it requires that the API has been created first.  

#### Syntax

`ern create-api-impl <apiName>`  

**Arguments**

`<apiName>`

* The package descriptor of the API for which to create an API implementation project

**Options**  

`--nativeOnly/-n`

* Generate an implementation skeleton project for a native implementation of the API  

`--jsOnly/-j`

* Generate an implementation skeleton project for a JavaScript implementation of the API  

`--outputDirectory/-o <directory>`

* Generate the project in a specified output directory  
* **Default**  The project is generated in a new directory named as the API implementation project. The new directory is created in the current working directory.  

`--hasConfig`
* Indicates if this api implementation requires some config during initialization.
* This option will be stored and reused during container generation to enforce config initialization

`--skipNpmCheck/-s`
* Skips npm check to see if the package already exists
* **Default** The value defaults to false. 

`--force/-f`

* Force the creation of an API implementation project  
* **Caution**  If there is already an implementation project in the target directory, the new project will overwrite the existing project completely. Use this option only if you are sure that you can overwrite any existing project.  

#### Examples

`ern create-api-impl react-native-weather-api`  
This example shows how to create an API skeleton project named `react-native-weather-api-impl`.

#### Remarks

* The name of the implementation mirrors the name of the API package with the `-impl` suffix.  
* If you do not specify a platform (for example, native v.s JavaScript), you are prompted to select a platform.    

#### Related commands

[ern create-api] | Create an API


[ern create-api]: ./create-api.md