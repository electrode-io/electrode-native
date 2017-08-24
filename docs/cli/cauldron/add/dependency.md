**Adds one or more native dependency(ies) to a Cauldron**

The following command can be used to add one or more new `native dependency(ies)` to a given non released native application version in a Cauldron. If you instead want to update the version(s) of already existing `native dependency(ies)`, you should use `ern cauldron update dependency` command.

Upon sucessful execution of this command, a new `Container` version will automatically be generated and published.  

This command should be of rare use. Indeed, `native dependency(ies)` used by the `MiniApp(s)` are automatically added to the native application version `Container` if they are not yet present in the `Container`. This command can be used to add react native `native dependency(ies)` that are not directly used by the `MiniApp(s)` but only used on the native side. This is not a common scenario, therfore this command should be of limited use.

Please note that you can only add `native dependency(ies)` versions that have been published to NPM, and cannot use `file` or `git` scheme for the `dependency(ies)` you add through this command. If one of these conditions is not met, the command will fail with an error.

### Command

#### `ern cauldron add dependency <dependency>`

Adds a single `native dependency` to a target native application version container.  

#### `ern cauldron add dependency --dependencies <dependencies>`

Adds one or more `native dependency(ies)` to a target native application version container. 

#### `ern cauldron add dependency --containerVersion/-v <version>`

Use a specific version for the newly generated container upon succesful execution of this command.  
If not using this option, the command will, by default, increment the patch number of the current container version (i.e if current container version is `1.2.3`, upon succesful execution of this command, new container version will be set as `1.2.4`).

#### `ern cauldron add dependency --descriptor/-d <descriptor>`

Will add the `native dependency(ies)` to a given target native application version in the Cauldron matching the provided native application descriptor. You can only pass a `complete native application descriptor` as the `native dependency(ies)` added through this command target only a specific single native application version.  
If this option is not used, the command will list all the non released native application versions from the Cauldron and will prompt you to choose one to add the `native dependency(ies)` to.
