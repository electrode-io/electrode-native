## `ern cauldron add nativeapp <descriptor>`
#### Description
* Add a new native application version to the currently activated Cauldron  

#### Syntax
`ern cauldron add nativeapp <descriptor>`

**Example**  
`ern cauldron add nativeapp MyNativeApp:ios:17.14.0`  

**Options**  

`--copyFromVersion/-c <version>`

* Copy the data of a native application version stored in the Cauldron.  
* You can use a specific version, for example `1.2.3`, or you can use `latest` if you want to copy the data from the latest version of the native application.  
* The `--copyFromVersion/-c <version>` option also copies the list of native dependencies and MiniApps as well as the container version to the new native application version.  
* If you use the `--copyFromVersion/-c <version>` option, you do not need to add all MiniApps again after creating a new native application version in the Cauldron.  
* This option is commonly used.  

#### Remarks
* The `ern cauldron add nativeapp <descriptor>` command is usually used when the development of a new version of the native application is started.  
* The new native application version is identified by the *complete native application description* in the Cauldron.

#### Related commands
 [ern cauldron update nativeapp] | Add a new native application version to the currently activated Cauldron
___
[ern cauldron update nativeapp]: ../update/nativeapp.md