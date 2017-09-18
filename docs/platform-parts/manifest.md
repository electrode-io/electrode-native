## Electrode React Native Manifest

While one of the Cauldron responsibility is to ensure that no mis-aligned, or non supported native dependency version makes its way in your mobile application, to avoid breaking things; the Manifest is there to help aligning native dependencies versions accross many different MiniApps in the first place.

Each Electrode React Native platform version is associated an array of supported native dependencies, along with their versions, such as the following :

```json
[
  "react-native@0.42.0",
  "react-native-code-push@1.17.1-beta",
  "react-native-stack-tracer@0.1.1",
  "react-native-vector-icons@4.0.0",
  "react-native-maps@0.13.1"
]
```

This array contains the list of all third party native dependencies (everything but APIs and APIs implementations) supported by a given Electrode React Native platform version, along with the versions that should be used.

Whenever native dependencies are added to a MiniApp through ern add command, based on the Electrode React Native version used, the command will know if the dependency is supported and if that's the case use the version declared in the manifest.

This way, the platform can guarantee that any MiniApp targeting a given Electrode React Native version will only include supported dependencies, at the same versions, making it effectively possible to add all these MiniApps in a single Container.

The platform stores its master manifest in a GitHub repository. You case see it [here](url).  
The master manifest is the one that will be used by Electrode React Native by default. For more advanced use cases, it is possible to override the master manifest as described later in this documentation.

The choice of not shipping the master manifest inside Electrode React Native itself, but keeping it in a git repository instead, is to allow for updating the manifest at any time. This is particularly useful to add new supported dependencies for a given Electrode React Native version, without having to wait for a next version of Electrode React Native to be released to include these dependencies support.

The master manifest is public and open sourced as well, so that anyone can contribute to it, mostly to add more native dependencies support (explained in more details later in this documentation).
That being said, once a native dependency version is stored in the manifest for a given Electrode React Native version, it should never be changed. Otherwise we'll lose the version alignment guarantee offered by the manifest. Nor can you remove native dependencies. Basically, it's only possible to add new native dependencies support.

In addition to the manifest itself (manifest.json), the Manifest repository also contains some configuration for all supported third party native modules, used by the Container generator to properly add these native modules to the Container.

If you are an open source MiniApp developer, you should always make sure to use the master manifest. This is the default operating mode of the platform, so you're good.
Ideally, on each new Electrode React Native version release, you should use the ern upgrade command to align your native dependencies on this new version of the platform. This way you can be sure that your MiniApp will be able to be added to any mobile application using any given Electrode React Native version. If your MiniApp is succesful, some contributors might even take care of that for you ;)

If you are a mobile application developper or team, and want to add MiniApps to your mobile application, you might want to consider sticking to a given version of react-native for a few releases of your mobile application before upgrading to a new version of it. Indeed, the problem of upgrading too frequently the version of react-native or associated native modules is that you won't be able to CodePush updates to these versions of your mobile application that have been shipped with a different version of react-native. 

The problem here is that, for each new Electrode React Native version, the master manifest will contain updated versions of most of the native dependencies, including the version of react-native itself. The master manifest will always use the latest version of react-native for each new Electrode React Native release.

In that context, it would be though to ask you to stick to a given Electrode React Native version for weeks or months. You won't get all the bug fixes and new goodies delivered in every release of Electrode React Native. That's where overriding the master manifest comes in handy.

### Overriding the master Manifest

It is possible to override the master Manifest with your own Manifest.  
There are a few reasons why you might want to do that :

- To stick to specific native dependencies versions for some time, while still allowing for Electrode React Native versions updates.
- To allow for the use of non open-sourced (private) native modules in your MiniApps
- To ease contributions to master manifest to add support for open sources native modules 

Overriding a Manifest is easy. Here are the actual steps involved :

1) Create your own Manifest repository on GitHub (just fork this [starter one](url))
2) Create a Manifest override config in your Cauldron (so that it is correctly applied to all users of this Cauldron)
3) Update your Manifest for your needs and maintain it over time

For the second step, here is a configuration sample desribing a manifest override :

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

The configuration object should be manually added to your Cauldron, at the same level as the nativeApps array.

The override url is the url of the GitHub repository containing your own Manifest  
The orrride type value can be either partial or full. For most use cases you'll want to use the partial type. full can be useful in fringe cases.

Here is the distinction between partial and full overrides :

#### Partial override

The array of dependencies and their versions used by a given Electrode React Native version, will be the union of both override Manifest and master Manifest. If a dependency is defined in both Manifests for a different version, the override version will take precedence, hiding the version defined in the master Manifest.

For the plugins (native modules) configurations, using the partial override type, Electrode React Native will look first for a matching plugin configuration inside the override Manifest and return the matching one if found. If none is found there, it will then look in the master Manifest.

#### Full override

Be it for dependencies, or plugin configurations, a full override means that only the override manifest will be queried by Electrode React Native. The master manifest will never be consumed. This kind of override actually completely hide the master manifest.

#### Guidelines for overriding Manifest use cases
 
If you want to override the master Manifest to stick to specific native dependencies versions for some time, you should choose a given Electrode React Native version and reuse the native dependencies versions associated with it to override the ones defined in newer versions of Electrode React Native. This way users can still update their Electrode React Native version while sticking to the same native dependencies versions as used with a previous version of Electrode React Native.

For example, you use the array of native dependencies versions declared for ern 0.4.0 to re-use it as such for versions 0.5.0 and 0.6.0 of Electrode React Native, overriding the native dependencies array of 0.5.0 and 0.6.0 defined in the master Manifest.

You can choose to change a native dependency version from the one used by the master manifest. However please be aware that doing so will most probably makes it harder to add open-sourced MiniApps to your mobile application, as alignment guarantees are lost.

If you want to override the master Manifest to use non open-sourced (private) native modules in your MiniApps, or want to contribute to Electrode React Native by adding the support for an non already supported open-sourced native module to the master Manifest, you'll need to know how to create native modules (plugins) configuration in the Manifest.

### Reusing exiting native modules

Electrode React Native comes with support for some popluar native modules, such as react-native-vector-icons, react-native-code-push or react-native-maps to name a few.  

Thanks to the React Native community there are tons of other open sourced useful native modules that could be used in your MiniApps.  

If the Electrode React Native version you are using does not yet support a native module you would like to use, you can add support for it to Electrode React Native by creating a plugin configuration in the Manifest (your override Manifest in case of a private native module or the master Manifest for an open sourced native module).

Why does Electrode React Native needs a plugin configuration ?  
Well, react-native comes with an awesome command : `react-native link` (formerly `rnpm`), that can be used to add any react native plugin (native module) to you react native application. Unfortunately this command is working fine in the context of a "pure" react native mobile application but won't work with Electrode React Native that needs to add the native modules to a Container library, not directly to a mobile application.  
We're working on improving plugin configurations to rely more on convention over configuration, and reduce manual work involved.

Also please note that because Electrode React Native generated APIs and APIs Implementations have a precisely known structure, we don't need to write any configuration to support them in Electrode React Native. So if you plan to work on a new native module, please rather consider Electrode React Native APIs.

In the Manifest repository, the supported plugins configurations can be found in the plugins directory.

This plugins directory contains directories that follow a certain naming convention, used by Electrode React Native to correcly match a plugin version with a plugin configuration given an Electrode React Native version

At the root of the plugins directory, are directories that will match a given Electrode React Native version, for example :

```
plugins/ern_v0.2.0+
plugins/ern_v0.4.0+
```

For example, if you are using ern `0.3.0`, the platform will look for a matching plugin configuration in `plugins/ern_v0.2.0+` directory. If you are using ern `0.5.0`, the platform will look for a matching plugin configuration first in `plugins/ern_v0.4.0+`, and if none found there, it will look in `plugins/ern_v0.2.0+`.

Inside platform versions directories, you will find directories that are holding the plugin configurations. These directories also follow a naming convention, used by platform to lookup a plugin configuration, for example :

```
plugins/ern_v0.2.0+/react-native-code-push_v1.17.0+
plugins/ern_v0.2.0+/react-native-linear-gradient_v2.0.0+
plugins/ern_v0.2.0+/react-native-maps_v0.13.1+
plugins/ern_v0.2.0+/react-native-maps_v0.14.0+
```

The naming of these directories include the minimum version of the plugin that the configuration targets. If a newer version needs a different configuration, a new directory can be created accordingly. (in the above example, you can see this is the case for react-native-maps).

Inside these directories lies the actual configuration of the plugin.

Let's take a closer look at a configuration, for example the one we use for react-native-code-push. The directory can be seen [here](https://gecgithub01.walmart.com/Electrode-Mobile-Platform/ern-master-manifest/tree/master/plugins/ern_v0.3.0%2B/react-native-code-push_v1.17.0%2B)

Here are the files that we can see in this directory :

```
CodePushPlugin.java
ElectrodeCodePushConfig.h
ElectrodeCodePushConfig.m
config.json
```

This plugin has support for both iOS and Android. Your native module could only have support for one platform.

The CodePushPlugin.java contains some code to add the CodePush native module package to the list of native modules to be loaded by React Native upon initialization of the Android Container library. It can optionally hold some code to allow the mobile app to configure the native module.

The ElectrodeCodePushConfig.h and ElectrodeCodePushConfig.m contains similar code, for iOS.

The config.json document holds the actual configuration of the plugin. It contains instructions that the Container generator will use to properly add the plugin to the Container.

The document can contain one or two top level objects : `android` and/or `ios`. If a plugin is only supported on one platform, it will only contain the specific platform object.  

Supported injection configuration directives come in two different kinds : `platform agnostic directives` that can be used for both iOS and Android platforms, and `platform specific directives`, that can only be used in the context of a given platform.  

#### Platform agnostic directives

- `copy`

Can be used to copy one or more files/directories to the target Container path.   
The `copy` directive is an array of objects, each containing a specific copy statement.  
The objects contain a `source` property and a `dest` property :  
    - `source` : A single file path or directory glob, indicating which files to copy  
    - `dest` : A target directory path where to copy the file(s)  

Example:  

```json
"copy": [
  { "source": "ios/**", "dest": "{{{projectName}}}/Libraries/CodePush" }
]
```

Will copy the entire content (files and directories recursively) of the plugin `ios` directory to the Container `/Libraries/CodePush` directory.

All plugins code need to be injected in the Container. That's why all plugins will have at least one `copy` statement in the `config.json` file. For the most part, on iOS the `dest` will be `"{{{projectName}}}/Libraries/{PLUGIN_NAME}"`.
`projectName` will be replaced during Container generation, by the name of the project (ElectrodeContainer in the case of Container generation), while `PLUGIN_NAME` should be the name of the plugin itself.

- `replaceInFile`

Can be used to perform string replacements in given files. This is useful on iOS as for some plugins we sometime need to replace the way imports are performed. 
The `replaceInFile` directive is an array of objects, each containing a specific replacement statement.  
The objects contain a `path` property, a `string` property and a `replaceWith` property :   
    - `path` : Path to the file that contains a string to be replaced  
    - `string` : String to be replaced  
    - `replaceWith` : The new string


Example:  

```json
{ "path": "{{{projectName}}}/Libraries/RNLocation/RNLocation.h", "string": "\"RCTBridgeModule.h\"", "replaceWith": "<React/RCTBridgeModule.h>" }
```

This will replace the string `"RCTBridgeModule.h"` with `<React/RCTBridgeModule.h>` in the `/Libraries/RNLocation/RNLocation.h` file in the Container.

#### Platform specific directives

#### Android

The following directives can only be used inside an `android` configuration object.

- `moduleName`  

The name of the Android `module` containing the plugin. If not specified, the plugin configuration will use `lib`, which is the convention most Android plugins adopt to name the module containing the plugin code.  

- `root`  

The root directory containing the Android module. If not specified, the plugin configuration will use `android`, which is the convention followed by most third party native modules.  

- `dependencies`  

An array of one or more dependencies to add to the Container when injecting this plugin. Some plugins might have dependencies on extra libraries that needs to be included in the Container. The Container generation will add all of these extra dependencies as `compile` statements to its `build.gradle` file.

Example:  

```json
"dependencies": [
  "com.google.android.gms:play-services-base:10.0.1",
  "com.google.android.gms:play-services-maps:10.0.1"
]
```

#### iOS

The following directives can only be used inside an `ios` configuration object.

- `containerPublicHeader`

Specifies one or more header to surface in the Container umbrella header. This is only needed for specific headers that needs to be accessed from outside the Container, by the application itself.

Example: 

```json
 "containerPublicHeader":[
   "ElectrodeBridgeHolder.h"
 ]
 ```

iOS also offer an addition directive object: `pbxProj`, which can include different directives to manipulate the Container `.pbxproj` file.

- `addProject`

Adds a plugin `xcodeproj` along with its target lib, to the Container.   
    - `path` : Path to the `xcodeproj` of the plugin   
    - `group` : Group to add the project to (`Libraries` should be used)  
    - `staticLibs` : An array of static libraries, targets of the plugin project, to link with the Container 

Example:  

```json
"addProject": [
  { "path": "AirMaps/AirMaps.xcodeproj", "group": "Libraries", "staticLibs": [ { "name": "libAIRMaps.a", "target": "AirMaps" } ] }
]
```

- `addHeaderSearchPath`  

Adds an header search path to the Container, mostly to add the proper path to the plugin headers. This is just an array of strings, each string being a specific path.

```json
"addHeaderSearchPath": [
 "\"$(SRCROOT)/{{{projectName}}}/Libraries/AirMaps/**\""
]
```

- `addHeader`

Adds an header from the plugin project, to the Container headers.   
    - `path` : Path to the header file to add  
    - `group` : Group containing the header
    - `public` : Boolean indicated whether the header should be public or not (default to false)

```json
 { "path": "ElectrodeReactNativeBridge/ElectrodeBridgeEvent.h", "group": "ElectrodeReactNativeBridge", "public": true }
```

- `addSource`

Adds a source file from the plugin project, to the Container list of sources.  
    - `path` : Path to the source file to add
    - `group` : Group containing the source file

```json
{ "path": "ElectrodeReactNativeBridge/ElectrodeObject.swift", "group": "ElectrodeReactNativeBridge" }
```

### Configurable native modules

Some native modules might need some extra configuration to be used at runtime. This is relatively rare, but for example this is the case for `react-native-code-push` native module that needs to be provided a deployment key upon initialization. Configurable plugins have some source code associated to them in the manifest plugin configuration, in addition to the `config.json` file.

For each Configurable plugin added to a Container, an extra parameter will be added to the Container initialization method that is called by the mobile application. This extra parameter will allow the client code, to pass the configuration of the plugin at Container initialization time.

Lets take a closer a closer look to these source files for both Android and iOS.

#### Android

`{PLUGIN_NAME}Plugin.java`

For example, for CodePush plugin, this file is named `CodePushPlugin.java`.   
You can see the content of this file, in the current master manifest [here](https://gecgithub01.walmart.com/Electrode-Mobile-Platform/ern-master-manifest/blob/master/plugins/ern_v0.3.0%2B/react-native-code-push_v1.17.0%2B/CodePushPlugin.java)

The core of this source file is the `hook` method. This method will get invoked by the Container during initialization. The last parameter is the actual `Config` instance of this plugin, as provided by the user when calling `ElectrodeReactContainer` `initialize` method.

```java
 public ReactPackage hook(
  @NonNull Application application,
  @NonNull ReactInstanceManagerBuilder reactInstanceManagerBuilder,
  @NonNull Config config)
```

The `Config` class for the plugin is declared in the same `.java` source file. It should follow the JAVA `builder` pattern. Mandatory configuration properties should be passed in the constructor, whereas optional properties should be provided through setter methods returning the Config instance to allow chaining. 

#### iOS

`Electrode{PLUGIN_NAME}Config.h` and `Electrode{PLUGIN_NAME}Config.m`

Two `ObjectiveC` files. For example, for CodePush plugin these files are named `ElectrodeCodePushConfig.h` and `ElectrodeCodePushConfig.m`.  
You can see the content of these files, in the current master manifest, [here](https://gecgithub01.walmart.com/Electrode-Mobile-Platform/ern-master-manifest/blob/master/plugins/ern_v0.3.0%2B/react-native-code-push_v1.17.0%2B/ElectrodeCodePushConfig.h) and [here](https://gecgithub01.walmart.com/Electrode-Mobile-Platform/ern-master-manifest/blob/master/plugins/ern_v0.3.0%2B/react-native-code-push_v1.17.0%2B/ElectrodeCodePushConfig.m).

A configuration class should use the `ElectrodePluginConfig` protocol.  

The `(void)setupConfigWithDelegate: (id<RCTBridgeDelegate>)` method will be called during Container initialization.

