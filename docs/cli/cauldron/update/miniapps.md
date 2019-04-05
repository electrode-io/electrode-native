## `ern cauldron update miniapps`

#### Description

* Update one or more MiniApps versions in a non-released native application version in a Cauldron  
* Perform multiple checks, including MiniApp dependencies analysis, to ensure compatibility with the target native application container  
* Generate and publish a new Container version  

#### Syntax

`ern cauldron update miniapps <miniapps..>`  

**Arguments**

`<miniapps..>`

* One or more package path to MiniApp(s) (delimited by spaces) to update in a target native application version in the Cauldron.
* The following types of MiniApp paths are not supported by this command :
  - File path (ex `file://Users/foo/MiniApp`)
  - Git path missing branch/tag or commit sha (ex: `https://github.com/foo/MiniApp.git`)
  - Registry path missing version (ex: `MiniApp`)
  - Registry path using a version range (ex: `MiniApp@^1.0.0`)


**Options**  

`--containerVersion/-v <version>`

* Specify a version for the new container  
* **Default**  Incremental patch number of the current container version  
Example: If the current container version is 1.2.3 and a version is not included in the command, the new container version will be 1.2.4.  

`--descriptor/-d <descriptor>`

* Update the MiniApps to a given target non-released native application version in the Cauldron matching the provided native application descriptor.  
* You can only pass a complete native application descriptor as the MiniApps updated using this command targets only a specific single native application version.  
**Default**  Lists all non-released native application versions from the Cauldron and prompts you to choose a descriptor.   

`--publishUnmodifiedContainer`

* Publish the Container even if it's identical to the current one. This can be used to perform some sort of Container promotion.  
For example, if you are generating development Containers using `1000.0.X` versioning convention and want to promote a development Container to a release Container using a different version (`18.0.0` for example), you can use this flag to perform this.
**Default** False. If Container is identical to the current one, if won't be published again.

#### Remarks

* If one MiniApp does not pass compatibility checks, the command will fail

#### Related commands
 [ern cauldron add miniapps] | Add one or more new MiniApps to a native application version

[ern cauldron add miniapps]: ../add/miniapps.md