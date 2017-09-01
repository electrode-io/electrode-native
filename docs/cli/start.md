**Starts the react-native packager for a composite bundle**

This command can be used to package multiple `MiniApp(s)` inside a single composite bundle and automatically starts the react-native local packager to serve this bundle.

It can be useful during development, if ever you need to launch and develop/debug your `MiniApp(s)` from within a native host application which contains other `MiniApp(s)` along with yours.

This command works in symbiosis with the `ern link` command, please refer to this command for more details.

### Command

#### `ern start`

Create a composite bundle out of multiple `MiniApp(s)` and start the react-native local packager to serve this bundle so that it can be loaded within the native host application.  
If you do not pass any argument to this command, it will prompt you to select a native application version from the `Cauldron`. It will use all the `MiniApp(s)` versions present in the `Container` of this native application version to run the command.

#### `ern start --descriptor/-d <descriptor>`

Target a specific native application version, associated to the provided `complete native application descriptor`. This will use whatever `MiniApp(s)` version(s) are currently declared in this native application version container to launch the command.

#### `ern start --miniapps/m <miniapps>`

Provide one or more `MiniApp(s)` to launch this command. The command will package all the provided `MiniApp(s)` in a composite bundle and start the react-native packager out of it. 
You can use any valid `yarn` package descriptor for the `MiniApp(s)` provided to this command, including git and file system path schemes.

### Remarks

This command can be considered as the `ern` equivalent of `react-native start`