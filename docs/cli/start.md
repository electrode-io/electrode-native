## `ern start`
#### Description
* Create a composite bundle out of multiple MiniApps and start the react-native local packager to serve this bundle so that it can be loaded within the native host application  

#### Syntax
`ern start`  

**Note**
If you do not pass an argument to this command, you are prompted to select a native application version from the Cauldron. The command uses whatever MiniApp versions are currently declared in this native application version container to launch the command.  

**Options**  

`--descriptor/-d <descriptor>`

* Target a specific native application version, associated to the provided *complete native application descriptor*.  
* This option uses whatever MiniApp versions are currently declared in this native application version container to launch the command.  

`--miniapps/m <miniapps>`

* Specify one or more MiniApps to launch this command  
* The command packages all the provided MiniApps in a composite bundle and starts the react-native packager.  
* You can use any valid Yarn package descriptor for the MiniApps provided to this command, including Git and other file system path schemes.  

#### Remarks
* This command can be used to package multiple MiniApps inside a single composite bundle and automatically start the react-native local packager to serve this bundle.  
* Use this command when you need to launch and develop or debug your MiniApps from within a native host application which contains other MiniApps along with your MiniApp.  
* This command works with the `ern link` command. For additional information, see the documentation for the `ern link` command.  

#### Related commands
 `ern link` | Link to a MiniApp directory
