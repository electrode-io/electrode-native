## `ern cauldron update dependencies <dependencies..>`
#### Description
* Update the versions of one or more native dependencies in a non-released target native application version container (Cauldron)  
* Generate and publish a new Container version

#### Syntax
`ern cauldron update dependencies <dependencies..>`

**Example**  
`ern cauldron update dependencies MyDependency@1.2.3`  
This example shows how to update the version of `MyDependency` to 1.2.3 in the native application version.  

**Options**  
`--containerVersion/-v <version>`
* Specify a version for the new container  
* **Default**  Incremental patch number of the current container version  
Example: If the current container version is 1.2.3 and a version is not included in the command, the new container version will be 1.2.4.

`--descriptor/-d <descriptor>`
* Update the native dependencies in a given target native application version in the Cauldron matching the provided native application descriptor  
* You can only pass a *complete native application descriptor* as the native dependencies updated using this command target only a specific single native application version.  
**Default**  Lists all non-released native application versions from the Cauldron and  prompts you to choose one to update.

#### Remarks
* The `ern cauldron update dependencies <dependencies..>` command is rarely used.  
* Native dependency versions are automatically updated if necessary when adding or updating MiniApps using the `ern cauldron add miniapps` command and the `ern cauldron update miniapps` command  
* The `dependencies` value should specify the version to update to.

#### Related commands
 `ern cauldron add dependencies` | Add one or more new native dependencies
