## `ern cauldron del miniapps`

#### Description

* Remove one or more MiniApps from a given non-released native application version in a Cauldron  
* Generate and publish a new Container version—so that the native applications can use the new Container version to access the new MiniApp that was added  
**Note** The `ern cauldron del miniapps <miniapps..>` command can remove (from the native application version container) all native dependencies that are only used by the removed MiniApps. The `ern cauldron del miniapps <miniapps..>` command does not do native dependency cleanup.

#### Syntax

`ern cauldron del miniapps <miniapps..>`  

**Arguments**

`<miniapps..>`

* One or more package path to MiniApp(s) (delimited by spaces) to remove from a native application version in the Cauldron.

**Options**  

`--containerVersion/-v <version>`

* Specify a version for the new container  
* **Default**  Incremental patch number of the current container version  
Example: If the current container version is 1.2.3 and a version is not included in the command, the new container version will be 1.2.4.  

`--descriptor/-d <descriptor>`

* Remove the MiniApps from a given target native application version in the Cauldron matching the provided native application descriptor  
* You can only pass a complete native application descriptor as the native dependencies removed using this command target only a specific single native application version.  
**Default**  Lists all non-released native application versions from the Cauldron and prompts you to choose one to remove from the MiniApps  

#### Remarks

* You don't need to run the `ern cauldron del miniapps <miniapps..>` command from within a MiniApp working directory.    
* You don't need to provide a version for the MiniApp when using the `ern cauldron del miniapps <miniapps..>` command. The version is ignored because only one version of a given MiniApp can be present in a container at any given time.  

#### Related commands

[ern cauldron del dependencies] | Manually cleanup native dependencies that are only used by the specified MiniApp

____
[ern cauldron del dependencies]: ./dependencies.md