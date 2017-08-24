**Removes one or more native dependency(ies) from a Cauldron**

This command can be used to remove one or more `native dependency(ies)` from a given non released native application version.  

The command will perform some checks during execution, to mainly make sure that no `MiniApp(s)` in the current container for this native application version, are using this/these `native dependency(ies)`. If at least one of the `MiniApp(s)` is relying on one of the native dependency(ies), the command will fail and list you the `MiniApp(s)` that are depending on it.  
If that is the case, the solution is to either remove the `MiniApp(s)` that are relying on this/these dependency(ies), or to remove the dependency(ies) from the incriminated `MiniApp(s)`.

Upon sucessful execution of this command, a new `Container` version will automatically be generated and published to acount for the removal of this/these native dependency(ies).

### Command

#### `ern cauldron del dependency <dependency>`

Removes a single `native dependency` from a target native application version container.  

#### `ern cauldron del dependency --dependencies <dependencies>`

Removes one or more `native dependency(ies)` from a target native application version container. 

#### `ern cauldron del dependency --containerVersion/-v <version>`

Use a specific version for the newly generated container upon succesful execution of this command.  
If not using this option, the command will, by default, increment the patch number of the current container version (i.e if current container version is `1.2.3`, upon succesful execution of this command, new container version will be set as `1.2.4`).

#### `ern cauldron add dependency --descriptor/-d <descriptor>`

Will remove the `native dependency(ies)` from a given target native application version in the Cauldron, matching the provided native application descriptor. You can only pass a `complete native application descriptor` as the `native dependency(ies)` removed through this command can target only a single native application version, as of now.
If this option is not used, the command will list all the non released native application versions from the Cauldron and will prompt you to choose one to remove the `native dependency(ies)` from.

#### `ern cauldron del dependency --force/-f`

Bypass compatibility checks and force remove the `native dependency(ies)` from the Cauldron.  
Only to be used if you really know what you're doing !
