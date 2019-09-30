## `ern run-android`

#### Description

* Runs a MiniApp on an Android emulator or connected device  

#### Syntax

`ern run-android`

**Options**  

`--baseComposite <compositePath>`

* Git or File System path, to the custom Composite repository (refer to the [custom Composite] documentation for more information).

`--dev [true|false]`
* Enable or disable React Native dev support

`--miniapps/m`
* One or more MiniApps to combine in the Runner Container

`--descriptor, -d`
* complete native application descriptor

`--mainMiniAppName`
* Name of the MiniApp to launch when starting the Runner application
* If you are running the command from the `MainApp` directory, only specify name of the `MiniApp` (Not the path).

`--usePreviousDevice/-u`
* Use the previously selected device to avoid prompt

`--host`
* Host or ip to launch the local packager on *(default: localhost)*

`--port`
* Port on which the local packager should listen on *(default: 8081)*

`--extra/-e`
* Optional extra configuration specific to local container and runner
* Override the android build config during local container generation and runner project by passing `androidConfig` attributes
  - **As a json string**  
  For example `--extra '{"androidConfig": {"androidGradlePlugin": "3.2.1","buildToolsVersion": "28.0.3","compileSdkVersion": "28","gradleDistributionVersion": "4.6","minSdkVersion": "19","supportLibraryVersion": "28.0.0","targetSdkVersion": "28"}}'`    
  - **As a file path**  
  For example `--extra /Users/username/my-container-config.json`  
  In that case, the configuration will be read from the file.  
  - **As a Cauldron file path**  
  For example `--extra cauldron://config/container/my-container-config.json`  
  In that case, the configuration will be read from the file stored in Cauldron.   
  For this way to work, the file must exist in Cauldron (you can add a file to the cauldron by using the [ern cauldron add file] command).

#### JavaScript engine

By default Electrode Native will run the MiniApp with a Container that uses JavaScriptCore engine. If you'd rather like to run the MiniApp with [Hermes](https://hermesengine.dev) engine, you should add the following inside the `ern` object of the MiniApp package.json :

```json
 "androidConfig": {
  "jsEngine": "hermes"
}
```

#### Remarks

* You can launch the MiniApp located in the current working directory or on a connected Android device or running emulator if available. If a connected Android device is not available, the command prompts you to select an emulator to launch from the list of installed emulator images.  
* The first time you run this command from within a MiniApp directory, it generates an Android directory containing the Android runner application project. If the Android folder already exists (it is not the first run of the `ern run-android` command for this MiniApp), the existing runner project is used.  
* After the runner project is generated, you can safely make native code modifications to it, knowing that the next time the `ern run-android` command is issued, the project and your changes will remain.  
* If you want to regenerate the runner project from scratch, remove the Android directory.  
* The miniapp can be any Yarn package descriptor, including Git or other file system path schemes.  
* The `ern run-android` command is the `ern` equivalent of the `react-native run-android` command.
* If you are running the command from the `MainApp` directory, only specify name of the `MiniApp` (Not the path) in the `--mainMiniAppName` option.

[custom Composite]: ./platform-parts/composite/index.md