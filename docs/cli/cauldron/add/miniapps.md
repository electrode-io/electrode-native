**Adds one or more MiniApp(s) to a Cauldron**

The following command can be used to add one or more new `MiniApp(s)` to a given non released native application version in a Cauldron. If you instead want to update the version(s) of already existing `MiniApp(s)`, you should use `ern cauldron update miniapps` command.

This command will perform multiple checks, including `MiniApp(s)` dependencies analysis to ensure compatiblity with the target native application container. 

Upon sucessful execution of this command, a new `Container` version will automatically be generated and published, so that the native application can use this new `Container` version to effectively get access to the new `MiniApp(s)` that have been added to it.  

Please note that you can only add `MiniApp(s)` versions that have been published to NPM, and cannot use `file` or `git` scheme for the `MiniApp(s)` you add through this command. If one of these conditions is not met, the command will fail with an error.

### Command

#### `ern cauldron add miniapps <miniapps..>`

Adds one or more `MiniApp(s)` to a target native application version container.  
The `MiniApp(s)` will be retrieved from NPM and therefore should be versioned NPM package descriptor(s) 
corresponding to the published `MiniApp(s)` version(s).  
If at least one `MiniApp` is not passing compatibility checks, the `MiniApp(s)` won't be added to the Cauldron and no new container version will be generated.

*Example :* `ern cauldron add miniapps MyFirstMiniApp@1.0.0 MySecondMiniApp@2.0.0`

#### `ern cauldron add miniapps <miniapps..> --containerVersion/-v <version>`

Use a specific version for the newly generated container upon succesful execution of this command.  
If not using this option, the command will, by default, increment the patch number of the current container version (i.e if current container version is `1.2.3`, upon succesful execution of this command, new container version will be set as `1.2.4`).

#### `ern cauldron add miniapps <miniapps..> --descriptor/-d <descriptor>`

Will add this or these `MiniApp(s)` to a given target native application version in the Cauldron matching the provided native application descriptor. You can only pass a `complete native application descriptor` as the `MiniApp(s)` added through this command target a specific single native application version.  
If this option is not used, the command will list all the non released native application versions from the Cauldron and will prompt to choose one to add this or these `MiniApp(s)` to.

*Example :* `ern cauldron add miniapps <miniapps..> -d MyNativeApp:android:1.0.0`  

#### `ern cauldron add miniapp --force/-f`  

Bypass compatibility checks and force add the `MiniApp(s)` to the Cauldron.  
Only to be used if you really know what you're doing !
