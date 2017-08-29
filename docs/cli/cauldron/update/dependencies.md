**Updates the version of one or more native dependency(ies) in Cauldron**

The following command can be used to update the version(s) of one or more existing `native dependency(ies)` in a non released native application version. If you instead want to add one or more new `native dependency(ies)`, you should use `ern cauldron add dependencies`. 

Upon sucessful execution of this command, a new `Container` version will automatically be generated and published.  

This command should be of rare use, considering that `native dependency(ies)` versions are automatically updated if necessary when adding or updating `MiniApps` through `ern cauldron add miniapps` and `ern cauldron update miniapps` commands.

### Command

#### `ern cauldron update dependencies <dependencies..>`

Update the version(s) of one or more given dependency(ies) in a non released native application version.  
The `dependencies` provided should include the version to update to. For example `ern cauldron update dependencies MyDependency@1.2.3` will update the  version of `MyDependency` to `1.2.3` in the native application version.

#### `ern cauldron update dependencies <dependencies..> --containerVersion/-v <version>`

Use a specific version for the newly generated container upon succesful execution of this command.  
If not using this option, the command will, by default, increment the patch number of the current container version (i.e if current container version is `1.2.3`, upon succesful execution of this command, new container version will be set as `1.2.4`).

#### `ern cauldron update dependencies <dependencies..> --descriptor/-d <descriptor>`

Will update the `native dependency(ies)` contained in a given target native application version in the Cauldron that matches the provided native application descriptor. You can only pass a `complete native application descriptor` as this command target can only a specific single native application version.  
If this option is not used, the command will list all the non released native application versions from the Cauldron and will prompt you to choose one in which to update the `native dependency((ies)` version(s).
