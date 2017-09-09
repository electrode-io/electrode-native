## `ern run-ios`
#### Description
* Runs a MiniApp on an iOS emulator or connected device  

#### Syntax
`ern run-ios`

**Options**  

`ern run-ios <miniapp>`

* Launch a specified MiniApp in the Runner application  

#### Remarks
* You can launch the MiniApp located in the current working directory or on a connected iOS device or running emulator if available. If a connected iOS device is not available, the command prompts you to select an emulator to launch from the list of installed emulator images.  
* The first time you run this command from within a MiniApp directory, it generates an iOS directory containing the iOS Runner application project. If the iOS folder already exists (it is not the first run of the `ern run-ios` command for this MiniApp), the existing runner project is used.  
* After the runner project is generated, you can safely make native code modifications to it, knowing that the next time the `ern run-ios` command is issued, the project and your changes will remain.  
* If you want to regenerate the runner project from scratch, remove the iOS directory.  
* The miniapp can be any Yarn package descriptor, including Git or other file system path schemes.  
* The `ern run-ios` command is the `ern` equivalent of the `react-native run-ios` command.
