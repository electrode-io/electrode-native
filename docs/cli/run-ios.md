**Runs a `MiniApp` on an iOS simulator or connected device**  

### Command

#### `ern run-ios`  

This command has to be executed from the root directory of a `MiniApp`.  

It will launch the `MiniApp` standalone, in the platform `Runner` application, on a connected ios device or running simulator (if any).  
If there is no connected ios device, the command will ask to select a simulator to launch from the list of installed images.  

Please note that the first time this command is run from within a `MiniApp` directory, it will generate an `ios` directory containing the `iOS runner` application project. If the `ios` folder already exist (not first run of `ern run-ios` command for this `MiniApp`), the existing `runner` project will be used. 
After the `runner` project is generated, you can safely make native code modifications to it, knowing that on next runs of `ern run-ios`, the project and your changes will be left untouched.  
If you want to regenerate the `runner` project from scratch, just remove the `ios` directory.

### Remarks

This command is the `ern` equivalent of `react-native run-ios`
