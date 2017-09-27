## Native dependencies management

The term "native" as used throughout the Electrode Native documentation, means any code that is compiled and executed inside the mobile application itself--not in the JavaScript virtual machine. This is a departure from the common meaning for example, of "native" meaning C/C++ code.  

This means that native app encapsulates code written in C/C++/Java/Kotlin on Android, and C/C++/ObjectiveC/Swift on iOS. This helps us easily distinguish between the JavaScript code itself and the mobile native code.

The JavaScript code itself is executed inside the JavaScript virtual machine and it can be updated using OTA updates. The mobile native code is part of the binary of the application and cannot be updated using OTA updates.

### Why the need for native dependencies management?

Electrode Native includes support for managing, tracking, and controlling the versions of the native dependencies that MiniApps depend on. The reason behind this support is that while JavaScript applications can contain multiple versions of a single dependency in their dependency graph, mobile applications can't achieve the same for their native dependencies.

For example, React Native itself will be a native dependency of the mobile application. It contains some native code that is going to be compiled and shipped within the binary of the application. Given that it is a native dependency, there can be only one version of it included in the mobile application at any given time. An iOS or Android mobile application cannot include two versions of the same native dependency. To illustrate with a React Native dependency, A mobile application cannot contain React Native 0.42.0 and React Native 0.43.0 at the same time. This is not a restriction of Electrode Native, but just the way mobile applications work regarding native dependencies.

On top of React Native itself, other native dependencies used by MiniApps can be either third-party React Native native modules supported by the platform (`react-native-code-push`, `react-native-vector-icons`, or `react-native-maps` for example) or can be platform-generated APIs or API implementations.

Because of this constraint and the fact that the Electrode Native platform allows you to package multiple MiniApps from different repositories into a mobile application, we offer support to help align the native dependency versions across all MiniApps as well as a guarantee that no MiniApp with a non-aligned native dependency version will make its way into your mobile application.

This support is provided through two modules of our platform: the Electrode Native manifest and the Electrode Native cauldron.

### The Electrode Native manifest

The manifest is a GitHub repository containing data used by Electrode Native. The data can be updated at any time without having to wait for the next platform release.

This section describes the `manifest.json` file that is stored in the Electrode Native manifest repository.

The `manifest.json` file contains a list of native dependencies along with their versions that are supported by a specific Electrode Native platform version. When you use the `ern add` command to add a JavaScript or native dependency to your MiniApp, Electrode Native queries the manifest to ensure that the native dependency is present in the `manifest.json` file--otherwise it's not supported yet. If the dependency is declared in the manifest, Electrode Native installs the specific version listed in the `manifest.json` file.

Electrode Native also checks the manifest repository when you use the `ern create-miniapp` command to determine which version of React Native to use. This check confirms that the MiniApps developed using a specific Electrode Native version will be properly aligned to the native dependencies versions they are using.

If you are a MiniApp developer intending to release open source MiniApps, then you'll want to make sure that you use the `ern add` command instead of the `yarn add` command or the `npm install` command--and that you upgrade the native dependency versions of your MiniApp to any new release of the platform. Use the `ern upgrade` command to upgrade the native dependency versions to a new platform release.

Electrode Native allows you to override the master open source manifest with your own private manifest. This is helpful if you work with private, non-open sourced native dependencies or if you want to use a specific React Native version for a while.

[Learn more about the manifest](../platform-parts/manifest.md)

### The Electrode Native cauldron

The Electrode Native cauldron is also a GitHub repository and at its core is the `cauldron.json` file. However, unlike the manifest, the cauldron should not be updated manually. The cauldron should only be accessed and updated using the `ern cauldron` subcommands.

The Electrode Native cauldron is a database that you can use to setup your own cauldron--which is basically as simple as creating a GitHub repository. There is no need to install a heavy database on a dedicated box.

The Electrode Native cauldron contains information about your mobile applications and their versions in the form of:  
* A list of all the MiniApps versions that are part of any given mobile application version  
* A list of native dependencies versions used by the MiniApps  

This is the information needed to generate a container.

Every MiniApp that needs to be added to your mobile application will first pass through the cauldron. The cauldron acts as a "gatekeeper" to verify versions before adding a MiniApp.

For each mobile application version, there will be a corresponding entry in the cauldron database. For example, Walmart iOS 17.14 or Walmart Android 17.10.0. The cauldron stores specific information pertaining to each version of your mobile application.  

The Electrode Native cauldron contains information about your mobile applications and their versions in the form of:  
* A list of all the MiniApps versions that are part of any given mobile application version  
* A list of native dependencies versions used by the MiniApps  

This is the information needed to generate a container.

Because the cauldron verifies which MiniApps versions and native dependencies versions are part of a mobile application version, it can perform necessary version control checks whenever a MiniApp needs to be added to a mobile application version. Before allowing entry of the MiniApp in the cauldron, checks are performed to ensure that the versions of the native dependencies used by the MiniApp do not conflict with current native dependencies included in this mobile application version. This should not happen often if MiniApps are correctly created based on a manifest--but this can happen, so we prefer to be extra cautious and perform final checks at the cauldron level.

All OTA MiniApps updates move through the cauldron first so that Electrode Native verifies whether or not it contains any conflicting native dependencies versions with the targeted mobile application version.

[Learn more about the cauldron](../platform-parts/cauldron.md)