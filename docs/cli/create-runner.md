## `ern create-runner <mainMiniAppName> <platforms..> --miniApps <miniapps..>`
#### Description
* Create standalone Runner application projects for iOS, Android. or both that use a Container—containing one or more MiniApps  




#### Syntax
`ern create-runner <mainMiniAppName> <platforms..> --miniApps <miniapps..>`  

**Options**  

`--dependencies <dependencies..>`

* Provide extra native dependencies to include in the container  
* This option can only be used with the `--miniapps` option. It cannot be used with the `--descriptor` option.  

`--descriptor <descriptor>`

* Create Runner application projects that use a Container—containing all the MiniApps and the native dependencies that are part of the mobile application version container matching the descriptor  

#### Remarks
* The generated Runner project is similar to the project that is generated to support the `ern run-ios` and `ern run-android` commands. However, using the `ern create-runner <mainMiniAppName> <platforms..> --miniApps <miniapps..>` command generates a Runner application project that is not bound to a single MiniApp. Therefore this command should be invoked from a directory that is not a MiniApp.    
* This command starts an application project containing multiple MiniApps.
* The projects are generated in Android and the iOS directories from the current working directory.  
* The `platforms` argument is a list of platforms for which to generate the runner. It can either be iOS, Android, or both.  
* The `mainMiniAppName` argument is the name of the main MiniApp. This is the MiniApp that should get launched when the Runner is started.  
* There isn't an `ern` command that launches the generated Runners.  To manually launch the generated Runner projects, use Android Studio or XCode to compile and launch the Runners—or use appropriate commands to open the generated Runner projects.  
