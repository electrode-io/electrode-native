**Updates the version(s) of one or more MiniApp(s) in Cauldron**

The following command can be used to update the version(s) of one or more `MiniApp(s)` in a non released native application version. If you instead want to add one or more brad new `MiniApp(s)` to a native application version, you should use `ern cauldron add miniapps` command.

This command will perform multiple checks, including `MiniApp(s)` dependencies analysis to ensure compatiblity with the target native application container. 

Upon sucessful execution of this command, a new `Container` version will automatically be generated and published.  

Please note that you can only update `MiniApp(s)` with versions that have been published to NPM, and cannot use `file` or `git` scheme for the `MiniApp(s)` you want to update through this command. If one of these conditions is not met, the command will fail with an error.

### Command

#### `ern cauldron update miniapps <miniapps..>`

Updates one or more `MiniApps` to new version(s) in target native application version container.   
The `MiniApp(s)` will be retrieved from NPM and therefore should be versioned NPM package descriptor(s) corresponding to the published `MiniApp(s)` version(s) to update to.  

#### `ern cauldron update miniapps <miniapps..> --containerVersion/-v <version>`

Use a specific version for the newly generated container upon succesful execution of this command.  
If not using this option, the command will, by default, increment the patch number of the current container version (i.e if current container version is `1.2.3`, upon succesful execution of this command, new container version will be set as `1.2.4`).

#### `ern cauldron update miniapps <miniapps..> --descriptor/-d <descriptor>`

Will update this or these `MiniApp(s)` in a given target non released native application version in the Cauldron matching the provided native application descriptor. You can only pass a `complete native application descriptor` as the `MiniApp(s)` updated through this command target a specific single native application version.  
If this option is not used, the command will list all the non released native application versions from the Cauldron and will prompt you to choose one for which versions of this/these `MiniApp(s)` should be update.

#### `ern cauldron update miniapps <miniapps..> --force/-f`  

Bypass compatibility checks and force the `MiniApp(s)` version(s) update in the Cauldron.  
Only to be used if you really know what you're doing !

