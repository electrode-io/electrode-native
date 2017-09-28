## `ern cauldron update miniapps <miniapps..>`
#### Description
* Update one or more MiniApps in a non-released native application version in a Cauldron  
* Perform multiple checks, including MiniApp dependencies analysis, to ensure compatibility with the target native application container  
* Generate and publish a new Container version  

#### Syntax
`ern cauldron update miniapps <miniapps..>`  

**Options**  

`--containerVersion/-v <version>`

* Specify a version for the new container  
* **Default**  Incremental patch number of the current container version  
Example: If the current container version is 1.2.3 and a version is not included in the command, the new container version will be 1.2.4.  

`--descriptor/-d <descriptor>`

* Update the MiniApps to a given target non-released native application version in the Cauldron matching the provided native application descriptor.  
* You can only pass a complete native application descriptor as the MiniApps updated using this command targets only a specific single native application version.  
**Default**  Lists all non-released native application versions from the Cauldron and prompts you to choose a descriptor.   

`--force/-f`

* Bypass compatibility checks and force-update the MiniApp in the Cauldron.  
**Caution**  Before using the `--force/-f` option, be sure that you can bypass compatibility checks.

#### Remarks
* You can only update MiniApp versions that have been published to NPM.  
* You cannot use the `file` or `git` scheme for the MiniApps that you want to update using the `ern cauldron update miniapps <miniapps..>` command.  
* The MiniApp is retrieved from NPM and should be a versioned with an NPM package descriptor corresponding to the published MiniApp version.  
* If one MiniApp does not pass compatibility checks, the MiniApp is not updated.

#### Related commands
 [ern cauldron add miniapps] | Add one or more new MiniApps to a native application version

[ern cauldron add miniapps]: ../add/miniapps.md