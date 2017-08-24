**MiniApp(s) compatibility checking**

This command allows to check the compatibility of one or more `MiniApp(s)` wtih a given native application version. 

Upon successful execution, this command will display a compatibility report indicating if the `MiniApp(s)` is/are compatible with the given native application version, as well as a formatted table, listing all compatible dependency and their versions as well as incompatible dependencies to help you precisely pinpoint what are the problematic non compatible native dependencies, if any.

### Command

#### `ern compat-check`

Check the compatibility of the current `MiniApp` with a native application version.
Running this command without any arguments will assume that the command is executed from within a `MiniApp` directory and will run compatibility checks for this `MiniApp`. If that is not the case, the command will log an error and exit.  

#### `ern compat-check <miniapp>`

Check the compatibility of a given `MiniApp` with a native application version.  
The `MiniApp` can be any valid `yarn` package descriptor, you can even use git or file system path schemes.

#### `ern compat-check --miniapps/-m`

Check the compatibility of one or more `MiniApp(s)` with a native application version. 
The `MiniApp(s)` can be any valid `yarn` package descriptor(s), you can even use git or file system path schemes.

#### `ern compat-check --descriptor/-d`

Specify the native application version, as a `complete native application descriptor` for which to check compatibility with the `MiniApp(s)`