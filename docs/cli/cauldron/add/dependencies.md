## `ern cauldron add dependencies <dependencies..>`
#### Description
* Add one or more new native dependencies to a target native application version container (Cauldron)  
* Generate and publish a new Container version

#### Syntax
`ern cauldron add dependencies <dependencies..>`

**Options**  
`--containerVersion/-v <version>`
* Specify a version for the new container  
* **Default**  Incremental patch number of the current container version  
Example: If the current container version is 1.2.3 and a version is not included in the command, the new container version will be 1.2.4.

`--descriptor/-d <descriptor>`
* Add the native dependencies to a given target native application version in the Cauldron matching the provided native application descriptor  
* You can only pass a complete native application descriptor as the native dependencies added using this command target only a specific single native application version.  
**Default**  Lists all non-released native application versions from the Cauldron and  prompts you to choose one to add to the native dependencies

#### Remarks
* The `ern cauldron add dependencies <dependencies..>` command is rarely used.  
* Native dependencies used by the MiniApps are automatically added to the native application version Container if they are not yet present in the Container.  
* This command can be used to add react-native `native dependencies` that are not directly used by the MiniApp but only used on the native side.  
* You can only add native dependency versions that have been published to NPM.  
* You cannot use the `file` or `git` scheme for the dependency that you add using this command.  
* An error message is displayed if the command is not formatted correctly.

#### Related commands
 `ern cauldron update dependencies` | Update the version of an existing native dependency

___  
