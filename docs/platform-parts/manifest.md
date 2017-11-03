## Electrode Native Manifest

While the Electrode Native cauldron makes sure that no misaligned-aligned or non-supported native dependency version makes it into your mobile application--the Electrode Native manifest aligns native dependency versions across multiple MiniApps in the first place.

Each Electrode Native platform version is associated to an array of supported native dependencies along with their versions. For example:

```json
[
  "react-native@0.42.0",
  "react-native-code-push@1.17.1-beta",
  "react-native-stack-tracer@0.1.1",
  "react-native-vector-icons@4.0.0",
  "react-native-maps@0.13.1"
]
```

The array contains the list of all third-party native dependencies (everything except APIs and API implementations) supported by a given Electrode Native platform version along with the versions that should be used.

When native dependencies are added to a MiniApp using the `ern add` command (based on the Electrode Native version used), the command verifies if the dependency is supported and if it is supported, the version declared in the Electrode Native manifest is used.

The Electrode Native platform guarantees that any MiniApp targeting a given Electrode Native version will only include supported dependencies, at the same versions--making it possible to add all MiniApps to a single Electrode Native container.

The Electrode Native platform stores its master manifest in a GitHub repository, [electrode-native-manifest](https://github.com/electrode-io/electrode-native-manifest/blob/master/manifest.json).  
By default, Electrode Native uses the master manifest. For more advanced use cases, it is possible to override the master manifest as described later in this documentation.

In order to update the manifest at any time, it is stored in a Git repository. This allows for adding new supported dependencies for an Electrode Native version at any time, without having to wait for the next Electrode Native main version to be released.

For any Electrode Native version defined in the master manifest:
* We can add new native dependencies support.  
* We cannot change or remove existing native dependencies versions (except for bridge and APIs as the following a versioning allowing for more flexibility)

If you change version of or remove native dependencies, the version alignment guarantees offered by the manifest will be lost.

The Electrode Native manifest repository contains:  
* The Electrode Native manifest file: `manifest.json`  
* Configurations for all supported third-party native modules (The configurations are used by the container generator to inject the native dependencies in the container during generation.)

Open source MiniApp developers should always use the master manifest. This is the default operating mode of the platform.

To align your native dependencies to a new Electrode Native version, use the `ern upgrade` command. When you align the native dependencies to a new Electrode Native version, your MiniApp will be able to be added to any mobile application using any Electrode Native version.

You might also consider using the same version of React Native for your mobile application, for a while, before upgrading to a new version of React Native. Indeed, upgrading (the version of react-native or associated native modules) too frequently might harm your release process because you cannot use CodePush to release updates to versions of your mobile application that have already been released with a different version of React Native.

For each new Electrode Native version, the master manifest will contain updated versions of most of the native dependencies, including the version of React Native itself. The master manifest will always uses the latest available version of React Native for each new Electrode Native release.

### Overriding the master Manifest

You can override the master manifest with your own manifest file:

- To stick to some specific native dependencies versions over time while still allowing for Electrode Native version updates
- To allow for the use of non open-sourced (private) native modules in your MiniApps.
- To facilitate contributions to the master manifest if you plan to add support for open source native modules

To override a manifest:

1) Create your own manifest repository on GitHub (you can fork this [starter manifest](https://github.com/electrode-io/electrode-native-starter-manifest)).
2) Create a manifest override configuration in your cauldron--so that it is correctly applied to all users of this cauldron.
3) Update and maintain your manifest as needed, over time.

The following example shows a configuration that includes a manifest override.

```json
"config": {
  "manifest": {
    "override": {
      "url": "git@github.com:user/ern-custom-manifest.git",
      "type": "partial"
    }
  }
}
```

The configuration object should be manually added to your cauldron at the same level as the `nativeApps` array.  

* The `override url` is the url of the GitHub repository containing your own Manifest  
* The `override type` value can be either partial or full. For most use cases you'll use the partial; full can be useful in rare cases.

#### Partial override

The array of dependencies and the versions used by a given Electrode Native version will be the combination of both the override manifest and the master manifest. If a dependency is defined in both manifests for a different version, the override version takes precedence, masking the version defined in the master manifest.

For plugins (native modules) configurations using the partial override type, Electrode Native first checks for a matching plugin configuration inside the override manifest and then returns the matching configuration if found. If a matching configuration is not found, it then checks the master manifest.

#### Full override

For dependencies or plugin configurations, a full override means that Electrode Native only queries the override manifest. The master manifest is never used. A full override  completely masks the master manifest.


#### Guidelines for overriding Manifest use cases

If you want to override the master manifest in order to keep specific native dependencies versions over time, you should choose a Electrode Native version and reuse the native dependencies versions associated with it--to override the native dependencies in newer versions of Electrode Native. This practice allows users to update their Electrode Native version-while keeping the same native dependencies versions used with a previous version of Electrode Native.

For example, you use the array of native dependencies versions declared for ern 0.4.0 to re-use it as such for versions 0.5.0 and 0.6.0 of Electrode Native, overriding the native dependencies array of 0.5.0 and 0.6.0 defined in the master Manifest.

You can also choose to change a native dependency version from the version used by the master manifest; however, this type of change loses the version alignment guarantee and makes it difficult to add open-sourced MiniApps to your mobile application.

If you want to override the master manifest to use private (not open sourced) native modules in your MiniApps, or if you want to contribute to Electrode Native by adding the support for an not-already supported open source native module to the master Manifest, you'll need to create native modules (plugins) configuration in the manifest file.

### Reusing exiting native modules

Electrode Native supports some popular native modules such as `react-native-vector-icons`, `react-native-code-push` or `react-native-maps` for example. And the React Native open source community provides many additional native modules that could be used in your MiniApps.  

If the Electrode Native version you are using does not yet support a native module that you would like to use, you can add support for it to Electrode Native by creating a plugin configuration in the manifest--this would be your override manifest in the case of a private native module or the master manifest for an open source native module.

**Why does Electrode Native require a plugin configuration?**  
In a pure React Native mobile application, you can use the `react-native link` command (formerly the `rnpm` command) to add a React Native plugin (native module) to your React Native application. However, Electrode Native requires that you add the native modules to a container library--not directly to a mobile application.  

**Note**  Electrode Native generated APIs and API implementations have a specific structure
and additional configuration is not needed to support them in Electrode Native. However, if you plan to work on a new native module, it's recommended that you consider using Electrode Native APIs.

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
```

The naming of these directories includes the minimum version of the plugin that the configuration targets. If a newer version needs a different configuration, a new directory can be created. This is shown in the above example for the `react-native-maps`.

The plugin configuration file is located within these sub-directories.

####Configuration example  
The following example shows the configuration files for the `react-native-code-push` plugin.  
The directory is view-able [here](https://gecgithub01.walmart.com/Electrode-Mobile-Platform/ern-master-manifest/tree/master/plugins/ern_v0.3.0%2B/react-native-code-push_v1.17.0%2B)


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

**Example**

```json
"dependencies": [
  "com.google.android.gms:play-services-base:10.0.1",
  "com.google.android.gms:play-services-maps:10.0.1"
]
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

### Configurable native modules

At runtime, some native modules require additional configuration settings. For example, the `react-native-code-push` native module requires a deployment key upon initialization.

Configurable plugins have some source code associated to them in the manifest plugin configuration file  in addition to the `config.json` file.

For each configurable plugin added to a container, an extra parameter must be added to the container initialization method that is called by the mobile application. This extra parameter allows the client code to pass the configuration of the plugin--at the time the container is initialized.

This section describes these source files for both Android and iOS.

#### Android
The following example describes an Android source file.

`{PLUGIN_NAME}Plugin.java`

In this example, the CodePush plugin file is named `CodePushPlugin.java`.   
You can view the configuration in the current master manifest file located  [here](https://gecgithub01.walmart.com/Electrode-Mobile-Platform/ern-master-manifest/blob/master/plugins/ern_v0.3.0%2B/react-native-code-push_v1.17.0%2B/CodePushPlugin.java)

The core of the source file is the `hook` method. The container invokes the `hook` method during initialization. The last parameter is the actual `Config` instance of the plugin as provided by the user when calling the `ElectrodeReactContainer` `initialize` method.

```java
public ReactPackage hook(
  @NonNull Application application,
  @NonNull ReactInstanceManagerBuilder reactInstanceManagerBuilder,
  @NonNull Config config)
```

The `Config` class for the plugin is declared in the same `.java` source file. The class should follow the JAVA `builder` pattern. Mandatory configuration properties should be passed in the constructor, whereas optional properties should be provided using setter methods returning the `Config` instance to allow chaining.

#### iOS
The following example describes an iOS source file.


`Electrode{PLUGIN_NAME}Config.h` and `Electrode{PLUGIN_NAME}Config.m`

This example includes two `ObjectiveC` files for for CodePush plugin: `ElectrodeCodePushConfig.h` and `ElectrodeCodePushConfig.m`.  
You can view the configuration in these files in the current master manifest file located  [here](https://gecgithub01.walmart.com/Electrode-Mobile-Platform/ern-master-manifest/blob/master/plugins/ern_v0.3.0%2B/react-native-code-push_v1.17.0%2B/ElectrodeCodePushConfig.h) and [here](https://gecgithub01.walmart.com/Electrode-Mobile-Platform/ern-master-manifest/blob/master/plugins/ern_v0.3.0%2B/react-native-code-push_v1.17.0%2B/ElectrodeCodePushConfig.m).

A configuration class should use the `ElectrodePluginConfig` protocol.  

The `(void)setupConfigWithDelegate: (id<RCTBridgeDelegate>)` method is called during the container initialization.
