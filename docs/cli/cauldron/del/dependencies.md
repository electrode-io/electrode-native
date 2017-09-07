## `ern cauldron del dependencies <dependencies..>`
#### Description
* Remove one or more native dependencies from a non-released native application version container (Cauldron)  
* Perform multiple checks to ensure that MiniApps in the current container, for this native application version, are not using the native dependencies  
**Note** If one of the MiniApps is relying on one of the native dependencies, the command fails. In this situation, a list is displayed showing you the MiniApps that are depending on the native dependency. To resolve this, do one of the following:
 - Remove the MiniApps that are relying on the dependency
 - Remove the dependency from the MiniApp  
* Create and publish a new Container version to account for the removal of the native dependencies

#### Syntax
`ern cauldron del dependencies <dependencies..>`  

**Options**  

`--containerVersion/-v <version>`

* Specify a version for the new container  
* **Default**  Incremental patch number of the current container version  
Example: If the current container version is 1.2.3 and a version is not included in the command, the new container version will be 1.2.4.

`--descriptor/-d <descriptor>`

* Remove the native dependencies from a given target native application version in the Cauldron matching the provided native application descriptor  
* You can only pass a complete native application descriptor as the native dependencies removed using this command target only a specific single native application version.  
**Default**  Lists all non-released native application versions from the Cauldron and  prompts you to choose one to remove from the native dependencies  

`--force/-f`

* Bypass compatibility checks and force-remove the native dependencies from the Cauldron.  
**Caution**  Before using the `--force/-f` option, be sure that you can bypass compatibility checks.

______
