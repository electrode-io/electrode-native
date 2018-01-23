## `ern cauldron add jsapiimpls`

#### Description

* Add one or more JS API implementation to a non-released native application version in a Cauldron  
* Generate and publish a new Container version  

#### Syntax

`ern cauldron add jsapiimpls <jsapiimpls..>`  

**Arguments**

`<jsapiimpls..>`

* One or more package path to JS API implementation(s) (delimited by spaces) to add to a target native application version in the Cauldron.

**Example**  

`ern cauldron add jsapiimpls MyJsApiImplementation@1.0.0 MyOtherJsApiImplementation@2.0.0`

**Options**  

`--containerVersion/-v <version>`

* Specify a version for the new container  
* **Default**  Incremental patch number of the current container version  
Example: If the current container version is 1.2.3 and a version is not included in the command, the new container version will be 1.2.4.  

`--descriptor/-d <descriptor>`

* Add the JS API implementation(s) to a given target native application version in the Cauldron matching the provided native application descriptor.  
* You can only pass a complete native application descriptor as the JS API implementation(s) added through this command targets only a specific single native application version.  
**Default**  Lists all non-released native application versions from the Cauldron and  prompts you to choose one to add to the JS API implementation.  
**Example** `ern cauldron add jsapiimpls <jsapiimpls..> -d MyNativeApp:android:1.0.0`  

#### Related commands

[ern cauldron update jsappiimpls] | Updates the version of an existing JS API implementation

_________
[ern cauldron update jsappiimpls]: ../update/jsappiimpls.md