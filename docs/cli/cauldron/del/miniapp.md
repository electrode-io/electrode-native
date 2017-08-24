**Removes one or more MiniApp(s) from a Cauldron**

The following command can be used to remove one or more `MiniApp(s)` from a given non released native application version in a Cauldron.  

Upon sucessful execution of this command, a new `Container` version will automatically be generated and published, so that the native application can use this new `Container` version to effectively get access to the new `MiniApp(s)` that have been added to it.  

### Caveeats

This command could remove from the native application version container, all `native dependency(ies)` that are only used by the `MiniApp(s)` that are removed. However as of now, the command does not do any `native dependency(ies)` cleanup. If you need to cleanup `native dependency(ies)` that were only used by this/these `MiniApp(s)`, you should do it manually through `ern del dependency`  command.

### Command

#### `ern cauldron del miniapp`

Removes the current `MiniApp` from a target native application version container.
Running this command without any arguments will assume that the command is executed from within a `MiniApp` directory. If that is not the case, the command will log an error and exit.  

#### `ern cauldron del miniapp <miniapp>`

Removes a single `MiniApp` from a target native application version container. 
This command does not have to be run from within a `MiniApp` working directory.  
You do not have to provide version of the `MiniApp` to this command, it will be ignored anyway, as only one version of a given `MiniApp` can be present in a container at any given time, the version is of no need to find the `MiniApp` in the Cauldron.

#### `ern cauldron del miniapp --miniapps/-m <miniapps>`

Removes one or more `MiniApp(s)` from a target native application version container.  
This command does not have to be run from within a `MiniApp` working directory.  
You do not have to provide version(s) of the `MiniApp(s)` to this command, it/they will be ignored anyway, as only one version of a given `MiniApp` can be present in a container at any given time, the version is of no need to find the `MiniApp(s)` in the Cauldron.

#### `ern cauldron del miniapp --containerVersion/-v <version>`

Use a specific version for the newly generated container upon succesful execution of this command.  
If not using this option, the command will, by default, increment the patch number of the current container version (i.e if current container version is `1.2.3`, upon succesful execution of this command, new container version will be set as `1.2.4`).


#### `ern cauldron del dependency --descriptor/-d <descriptor>`

Will remove the `MiniApp(s))` from a given target native application version in the Cauldron, matching the provided native application descriptor. You can only pass a `complete native application descriptor` as the `MiniApp(s)` removed through this command can target only a single native application version, as of now.  
If this option is not used, the command will list all the non released native application versions from the Cauldron and will prompt you to choose one to remove the `MiniApp(s)` from.
