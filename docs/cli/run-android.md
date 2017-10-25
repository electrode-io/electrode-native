## `ern run-android`

#### Description

* Runs a MiniApp on an Android emulator or connected device  

#### Syntax

`ern run-android`

**Options**  

`--dev [true|false]`
* Enable or disable React Native dev support

`--miniapps/m`
* One or more MiniApps to combine in the Runner Container

`--dependencies, --deps`
* One or more native dependencies to add to the Runner Container

`--descriptor, -d`
* complete native application descriptor

`--mainMiniAppName`
* Name of the MiniApp to launch when starting the Runner application

`--usePreviousEmulator/-u`
* Use the previously selected emulator to avoid prompt

#### Remarks

* You can launch the MiniApp located in the current working directory or on a connected Android device or running emulator if available. If a connected Android device is not available, the command prompts you to select an emulator to launch from the list of installed emulator images.  
* The first time you run this command from within a MiniApp directory, it generates an Android directory containing the Android runner application project. If the Android folder already exists (it is not the first run of the `ern run-android` command for this MiniApp), the existing runner project is used.  
* After the runner project is generated, you can safely make native code modifications to it, knowing that the next time the `ern run-android` command is issued, the project and your changes will remain.  
* If you want to regenerate the runner project from scratch, remove the Android directory.  
* The miniapp can be any Yarn package descriptor, including Git or other file system path schemes.  
* The `ern run-android` command is the `ern` equivalent of the `react-native run-android` command.
