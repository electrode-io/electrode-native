
Electrode Native supports some popular native modules such as `react-native-vector-icons`, `react-native-code-push` or `react-native-maps` for example. And the React Native open source community provides many additional native modules that could be used in your MiniApps.  

If the Electrode Native version you are using does not yet support a native module that you would like to use, you can add support for it to Electrode Native by creating a plugin configuration in the manifest--this would be your override manifest in the case of a private native module or the master manifest for an open source native module.

**Why does Electrode Native require a plugin configuration?**  
In a pure React Native mobile application, you can use the `react-native link` command (formerly the `rnpm` command) to add a React Native plugin (native module) to your React Native application. However, Electrode Native requires that you add the native modules to a container library--not directly to a mobile application.  

**Note**
Electrode Native generated APIs and API implementations have a specific structure
and additional configuration is not needed to support them in Electrode Native. However, if you plan to work on a new native module, it's recommended that you consider using Electrode Native APIs.

#### Creating plugin configurations

In the manifest repository, the supported plugin configurations are located in the plugins directory. This plugins directory contains sub-directories that follow a specific naming convention that is used by Electrode Native to correctly match a plugin version with a plugin configuration--for a specific Electrode Native version.

The list below shows an example of the directory naming convention that matches Electrode Native versions.

```
plugins/ern_v0.2.0+
plugins/ern_v0.4.0+
```

Considering the example above, if you are using version `ern` `0.3.0`, the Electrode Native platform looks for a matching plugin configuration in the `plugins/ern_v0.2.0+` directory. If you are using version ern `0.5.0`, the Electrode Native platform looks for a matching plugin configuration first in the `plugins/ern_v0.4.0+` directory and if the configuration is not found that directory, the platform looks in the `plugins/ern_v0.2.0+` directory.

In addition, the plugin configuration files are located in directories within the version directories. These directories also follow a naming convention used by the Electrode Native platform to lookup a plugin configuration, for example:

```
plugins/ern_v0.2.0+/react-native-code-push_v1.17.0+
plugins/ern_v0.2.0+/react-native-linear-gradient_v2.0.0+
plugins/ern_v0.2.0+/react-native-maps_v0.13.1+
plugins/ern_v0.2.0+/react-native-maps_v0.14.0+
plugins/ern_v0.2.0+/@myscope/react-native-my-module_v1.0.0+
```

The naming of these directories includes the minimum version of the plugin that the configuration targets. If a newer version needs a different configuration, a new directory can be created. This is shown in the above example for the `react-native-maps`.

The plugin configuration file is located within these sub-directories.

#### Configuration example  

The following example shows the configuration files for the `react-native-code-push` plugin.  
The directory is view-able [here](https://github.com/electrode-io/electrode-native-manifest/tree/master/plugins/ern_v0.13.0%2B/react-native-code-push_v1.17.0%2B)


```
CodePushPlugin.java
ElectrodeCodePushConfig.h
ElectrodeCodePushConfig.m
config.json
```

Although the plugin has support for both iOS and Android platforms. Your native module can support only one platform.

The `CodePushPlugin.java` file contains configuration information to add the CodePush native module package to the list of native modules--to be loaded by React Native upon initialization of the Android Container library. The file can optionally include the configuration to allow the mobile app to configure the native module.

The `ElectrodeCodePushConfig.h` file and `ElectrodeCodePushConfig.m` file contains similar code for the iOS platform.

The `config.json` file holds the actual plugin configuration. It contains instructions that the container generator will use to add the plugin to the container.

The document can contain one or two top-level objects: `android` and/or `ios`. If a plugin is only supported on one platform, it will only contain that specific platform object.  

There are two supported injection configuration directives:  
* The `platform agnostic directives` can be used for both iOS and Android platforms.  
* The `platform specific directives` can be used only in the context of a specific platform.  

#### Platform-agnostic directives

The platform-agnostic directives are described in this section.

- `copy`

Used to copy one or more files or directories to the target container directory.   
The `copy` directive is an array of objects, each containing a specific copy statement.  
The objects contain a `source` property and a `dest` property:  
    - `source` : A single file path or directory glob indicating the files to copy  
    - `dest` : A target directory where the files will be copied to  

**Example**  

```json
"copy":[
   {
      "source":"ios/**",
      "dest":"{{{projectName}}}/Libraries/CodePush"
   }
]
```

The example above shows how to copy the entire content (files and directories) of the plugin `ios` directory to the container `/Libraries/CodePush` directory.

All plugin code needs to be injected in the container--therefore they will have at least one `copy` statement in the `config.json` file. For the most part, in iOS, the `dest` will be `"{{{projectName}}}/Libraries/{PLUGIN_NAME}"`.  
`projectName` will be replaced during Container generation by the name of the project (`ElectrodeContainer` in the case of container generation), while `PLUGIN_NAME` should be the name of the plugin itself.  

- `replaceInFile`

Used to perform string replacements in specified files. This is useful for the iOS platform as some plugins are sometimes needed to replace the way imports are performed.  
The `replaceInFile` directive is an array of objects, each containing a specific replacement statement.  
The objects contain a `path` property, a `string` property and a `replaceWith` property:   
    - `path` : Path to the file that contains a string to be replaced  
    - `string` : String to be replaced  
    - `replaceWith` : The new string

**Example**  

```json
{
   "path":"{{{projectName}}}/Libraries/RNLocation/RNLocation.h",
   "string":"\"RCTBridgeModule.h\"",
   "replaceWith":"<React/RCTBridgeModule.h>"
}
```

This example shows how to replace the string `"RCTBridgeModule.h"` with `<React/RCTBridgeModule.h>` in the `/Libraries/RNLocation/RNLocation.h` file in the container.

- `applyPatch`

Apply a given patch file, by running `git apply` command, from a specific directory.  
The value of this property should be a single object containing the following two properties :
  - `patch` : Path to the patch file to apply, relative to the directory containing the pluging configuration file (`config.json`).
  - `root` : Path to the directory from which to run the `git apply` command, relative to the container generator output directory. Mutually exclusive with `inNodeModules`.
  - `inNodeModules` : If true, root will be set to root location of the plugin in node nodules. Mutually exclusive with `root`.

**Example**

```json
{
  "patch": "foo.patch",
  "root": "{{{projectName}}}/Libraries/BarNativeModule"
}

```

This example applies the `foo.patch` patch file, by running `git apply` command from the `{{{projectName}}}/Libraries/BarNativeModule` directory.  

#### Platform-specific directives

The platform-specific directives for Android and iOS are described in this section.

#### Android

The following directives can only be used inside an `android` configuration object.

- `moduleName`  

The name of the Android `module` containing the plugin. By default, the plugin configuration uses `lib`, which is the convention most Android plugins adopt to name the module containing the plugin code.  

- `root`  

The root directory containing the Android module. By default, the plugin configuration uses `android`, which is the convention followed by most third-party native modules.  

- `dependencies`  

An array of one or more dependencies used to add to the container when injecting this plugin. Some plugins might have dependencies on extra libraries that need to be included in the container. The container generation adds all of these extra dependencies as `compile` statements to its `build.gradle` file.  

If the `transitive` flag is needed for a given dependency, it is possible to use the prefix `transitive:` in front of the dependencies.

**For example**

```json
"dependencies": [
  "com.google.android.gms:play-services-base:10.0.1",
  "com.google.android.gms:play-services-maps:10.0.1",
  "transitive:com.crashlytics.sdk.android:crashlytics:2.9.2@aar"
]
```

**Will result in the following injection in build.gradle:**

```gradle
compile 'com.google.android.gms:play-services-base:10.0.1'
compile 'com.google.android.gms:play-services-maps:10.0.1'
compile('com.crashlytics.sdk.android:crashlytics:2.9.2@aar') { transitive = true }
```

- `features`

An array of one or more [Android hardware or software features](https://developer.android.com/guide/topics/manifest/uses-feature-element) used by the native module, to add to the container manifest when injecting this plugin.

**For example**

```json
"features" : [
  "android.hardware.bluetooth"
]
```

**Will result in the following injection in Container manifest**

```xml
<uses-feature android:name="android.hardware.bluetooth" />
```

#### iOS

The following directives can only be used inside an `ios` configuration object.

- `containerPublicHeader`

Specifies one or more header to surface in the Container umbrella header. This is used only for specific headers that must be accessed from outside the container by the application itself.

**Example**

```json
"containerPublicHeader": [
  "ElectrodeBridgeHolder.h"
]
```

iOS also provides an additional directive object: `pbxProj`. The `pbxProj` directive can include directives used to manipulate the container `.pbxproj` file.

- `addProject`

Adds a plugin `xcodeproj` and its target library to the Container.
    - `path` : Path to the `xcodeproj` of the plugin   
    - `group` : Group to add the project to (`Libraries` should be used)  
    - `staticLibs` : An array of static libraries, targets of the plugin project, to link with the Container

**Example**


```json
"addProject": [
  {
    "path": "AirMaps/AirMaps.xcodeproj",
    "group": "Libraries",
    "staticLibs": [
      {
        "name":"libAIRMaps.a",
        "target":"AirMaps"
      }
    ]
  }
]
```

- `addHeaderSearchPath`  

Adds a header search path to the container. This directive is used to add the proper path to the plugin headers. This is an array of strings--each string is a specific path.

```json
"addHeaderSearchPath": [
  "\"$(SRCROOT)/{{{projectName}}}/Libraries/AirMaps/**\""
]
```

- `addHeader`

Adds a header from the plugin project to the container headers.   
    - `path` : Path to the header file to add  
    - `group` : Group containing the header
    - `public` : Boolean indicated whether the header should be public or not (default to false)

```json
{
   "path":"ElectrodeReactNativeBridge/ElectrodeBridgeEvent.h",
   "group":"ElectrodeReactNativeBridge",
   "public":true
}
```

- `addSource`

Adds a source file from the plugin project to the container list of sources.  
    - `path` : Path to the source file to add
    - `group` : Group containing the source file

```json
{
  "path": "ElectrodeReactNativeBridge/ElectrodeObject.swift",
  "group": "ElectrodeReactNativeBridge"
}
```

- `setBuildSettings`

Set one or more build setting(s) in one or more pbxproj(s) associated to the plugin.
For example setting `ENABLE_BITCODE` to `NO` for `Debug` and `Release` configurations of `Foo` plugin project :

```json
"setBuildSettings": [
  { 
    "path": "{{{projectName}}}/Libraries/Foo/Foo.xcodeproj/project.pbxproj",
    "buildSettings": {
      "configurations": ["Debug", "Release"],
      "settings": { "ENABLE_BITCODE": "NO" }
    }
  }
]
```

**The following directives are only available when using React Native >= 0.61.0**

- `podFile`

Path to a Podfile to use for the Container, relative to the directory containing the plugin config.json file.\
Can only be set in 'react-native' plugin configuration.


- `podspec`

Path to a podspec file to use for the plugin, relative to the directory containing the plugin config.json file.\
Can be used in case a native module doesn't have yet an available podspec file or if the podspec file of the native module needs to be different than the one shipped with it.

- `extraPods`

Array of extra pod statements that will be injected in the Container Podfile.

- `requiresManualLinking`

Boolean flag that indicates whether this plugin requires manual linking.\
If defined and set to `true`, all plugin directives will be processed.
If not defined (default) or set to false, only `podFile`, `podspec` and `extraPods` directives will be processed.\n
This should only be set to `true` in very rare cases, for plugins that do not support auto linking.
