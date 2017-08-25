**Runs a `MiniApp` on an Android emulator or connected device**  

### Command

#### `ern run-android`  

This will launch the `MiniApp` located in the current working directory, on a connected Android device or running emulator (if any).  
If there is no connected Android device, the command will ask to select an emulator to launch from the list of installed emulator images.  

Please note that the first time this command is run from within a `MiniApp` directory, it will generate an `android` directory containing the `Android runner` application project. If the `android` folder already exist (not first run of `ern run-android` command for this `MiniApp`), the existing `runner` project will be used. 
After the `runner` project is generated, you can safely make native code modifications to it, knowing that on next runs of `ern run-android`, the project and your changes will be left untouched.  
If you want to regenerate the `runner` project from scratch, just remove the `android` directory.

#### `ern run-android <miniapp>`

Will launch the given `miniapp` in the Runner application. 
The `miniapp` can be any `yarn` package descriptor, including `git` or `file system` path schemes.

### Remarks

This command is the `ern` equivalent of `react-native run-android`
