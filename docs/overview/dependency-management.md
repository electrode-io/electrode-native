## Native dependencies management

Before we start, here is a disambiguation intended to `mobile application developers` : We use the term `native` dependency throughout this page (and in some other parts of our documentation). `native` here does not mean what most mobile application developpers, not dealing with `React Native` are accustomed to. `native` in our context does not mean `C/C++` code, but rahter mean any kind of code that is being compiled and executed inside the mobile application itself (and not in the `JavaScript` VM). This means that `native` encapsulate code written in C/C++/Java/Kotlin on Android and C/C++/ObjectiveC/Swift on iOS. This helps us easily distinguish between the `JavaScript` code itself, being executed inside the `JavaScript` VM (and can be updated through OTA updates), and the `mobile native` code, that is part of the binary of the application (and cannot be updated through OTA updates).

### Why the need for native dependencies management ?

`Electrode React Native` comes with support for managing, tracking and controlling the versions of the native dependencies that `MiniApps` are depending upon.

The reason behind this support is that while `JavaScript` applications can contain multiple versions of a single given dependency in their dependency graph, mobile applications can't achieve the same for their native dependencies.

For example, `react-native` itself will be a native dependency of the mobile application. It contains some `native` code that is going to be compiled and shipped within the binary of the application. Given that it is a native dependency, there can be only one version of it included in the mobile application at any given time. A mobile application, be it iOS or Android, cannot include two versions of the same native dependency (to illustrate with `react-native` dependency, it cannot contain react-native `0.42.0` and react-native `0.43.0` at the same time). This is not a restriction of `Electrode React Native`, but just the way mobile application work arround native dependencies.

On top of `react-native` itself, other native dependencies used by `MiniApps` can be either third party React Native `native modules` supported by the platform (`react-native-code-push`, `react-native-vector-icons`, `react-native-maps` to name a few) or can be platform generated `APIs` or `APIs implementations`.

Because of this constraint, and the fact that `Electrode React Native` platform allows you to package multiple `MiniApps` from different repositories into a mobile application, we need to offer proper support to help align the native dependencies versions accross all `MiniApps` as well as offer guarantees that no `MiniApp` with a non aligned native dependency version will make its way into your mobile application.

This support is provided through two "modules" of our platform : the `Manifest` and the `Cauldron`.

### The Manifest

The `Manifest` as a whole, is actually a `GitHub` repository containing different pieces of data, allowing anyone to update at any time some data used by the platform, without having to wait for a next platform release.
In this section we will focus on a single JSON document stored in the `Manifest` repository : `manifest.json`.

The `manifest.json` JSON document is actually quite simple. All it contains is the list of native dependencies along with their versions that are supported by any given `Electrode React Native` platform version. When you'll use the `ern add` command to add a JavaScript or native dependency to your `MiniApp`, `Electrode React Native` will query the manifest to ensure that, in the case of a native dependency, it is present in the `manifest.json` (oterwise it means that it's not supported yet), and will also install the specific version listed in the `manifest.json`, in case the dependency is declared in the manifest. It will also look at the `Manifest` when you use `ern create-miniapp` command, as it will need to know which version of `react-native` to use.

This way, `MiniApps` developed using a given `Electrode React Native` version will be properly aligned when it come to the native dependencies versions they are using.

If you are a `MiniApp` developer ntending to release open-sourced `MiniApp(s)`, then you'll just want to make sure that you use `ern add` (instead of `yarn add` or `npm install`) and that you upgrade the native dependencies versions of your `MiniApp` upon any new release of the platform (`ern upgrade` command can help you with that).

For more advanced use cases, we offer support to override the master open source `Manifest` with your own private one. This is of use if you are dealing with some private, non open sourced, native dependencies or if you want to stick with a given `react-native` version for a while for example.

[Learn more about the Manifest](url)

### The Cauldron

The `Cauldron` is also a `GitHub` repository and at its core also lies a JSON document : `cauldron.json`.

However it is very different from the `Manifest`. Indeed, first of all, the `Cauldron` is not meant to be updated manually as you would do for the `Manifest`. The `Cauldron` should only be accessed and updated through dedicated `ern cauldron` subcommands.

You can think of the `Cauldron` as a database. We just made it way more convenient for users to setup their own `Cauldron`, which is as simple as creating a `GitHub` repository, instead of having to install some kind of heavy database on a dedicated box. 

The `Cauldron` contains some information about your mobile applications and their versions. Every `MiniApp` that needs to be added to your `mobile application` will transit first through the `Cauldron`. In that sense, in addition of being a database, you should aslo consider the `Cauldron` as being a "gatekeeper".  

For each of your mobile application versions, there will be a corresponding entry in the `Cauldron` database (for example `Walmart iOS 17.14` or `Walmart Android 17.10.0`). The `Cauldron` will store specific information pertaining to each version of your mobile application.  

Along other data, it will keep the list of all the `MiniApps` versions that are part of any given mobile application version, as well as the list of native dependencies versions used by this `MiniApps`. This is actually the information needed to generate a `Container`.

Because the `Cauldron` is the source of truth when it comes to knowing which `MiniApps` versions and `native dependencies` versions are part of a mobile application version, it can perform necessary version control checks whenever a `MiniApp` needs to be added to a mobile application version. Before allowing entry of the `MiniApp` in the `Cauldron`, checks will be performed to ensure that the versions of the native dependencies used by the `MiniApp` do not conflict with current native dependencies included in this mobile application version. This should not happen too often if `MiniApps` are correctly created based on a `Manifest`, but this can happen, so we prefer to be extra cautious and perform final checks at the `Cauldron` level.

Also, all `MiniApps` that needs to be updated over the air will transit through the `Cauldron` first so that we can make sure that it does not contain any conflicting native dependencies versions with the targeted mobile application version.

[Learn more about the Cauldron](url)