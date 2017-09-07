## `ern cauldron add miniapps <miniapps..>`
#### Description
* Add one or more MiniApps to a non-released native application version in a Cauldron  
* Perform multiple checks, including MiniApp dependencies analysis, to ensure compatibility with the target native application container  
* Generate and publish a new Container version  
  The native application uses the new Container version to access the new MiniApp.

#### Syntax
`ern cauldron add miniapps <miniapps..>`  

**Example**  
`ern cauldron add miniapps MyFirstMiniApp@1.0.0 MySecondMiniApp@2.0.0`

**Options**  

`--containerVersion/-v <version>`

* Specify a version for the new container  
* **Default**  Incremental patch number of the current container version  
Example: If the current container version is 1.2.3 and a version is not included in the command, the new container version will be 1.2.4.  

`--descriptor/-d <descriptor>`

* Add the MiniApp to a given target native application version in the Cauldron matching the provided native application descriptor.  
* You can only pass a complete native application descriptor as the MiniApp added through this command targets only a specific single native application version.  
**Default**  Lists all non-released native application versions from the Cauldron and  prompts you to choose one to add to the MiniApp.  
**Example** `ern cauldron add miniapps <miniapps..> -d MyNativeApp:android:1.0.0`  

`--force/-f`

* Bypass compatibility checks and force-add the MiniApp to the Cauldron.  
**Caution**  Before using the `--force/-f` option, be sure that you can bypass compatibility checks.

#### Remarks
* You can only add MiniApp versions that have been published to NPM.  
* You cannot use the `file` or `git` scheme for the MiniApp that you add using the `ern cauldron add miniapps <miniapps..>` command.  
* The MiniApp is retrieved from NPM and should be a versioned with an NPM package descriptor corresponding to the published MiniApp version.  
* If one MiniApp does not pass compatibility checks, the MiniApp is not added to the Cauldron and a new container version is not generated.

#### Related commands
 `ern cauldron update miniapps` | Updates the version of an existing MiniApp

_________
