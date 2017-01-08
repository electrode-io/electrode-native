## electrode-react-native command line tool

**EXPERIMENTAL - Early stage**

* Current implementation do not cover all commands included in the following documentation *

As discussed in the introduction, this command line tool gives access to the whole API surface, while adding more powerful commands on top of it (ultimately based on cauldron queries in one way or antoher).

Depending of the client infrastructure and development lifecycle this command line tool will be used by different actors. In an environment without any CI platform, all commands of this tool might be executed directly on a developer workstation, while in a more structure development environment with a CI platform, some of these commands might get triggered and executed by the CI platform.

The electrode-react-native client will offer the following commands / subcommands (as of this writing) :

```
├── electrode-react-native
│   ├── cauldron                    [=== Cauldron client ===]
│   │   ├── add                     [--- Add stuff to the cauldron --]
│   │   |   ├── nativeapp           Add a native application
│   │   |   ├── dependency          Add a native app dependency
│   │   |   ├── binary              Add a native app binary
│   │   ├── del                     [--- Remove stuff from the cauldron --]
│   │   |   ├── nativeapp           Remove a native application
│   │   |   ├── dependency          Remove a native dependency
│   │   ├── get                     [--- Retrieve stuff from the cauldron --]
│   │   |   ├── nativeapp           Get a native application info
│   │   |   ├── dependency          Get native dependencies info
│   │   |   ├── binary              Get the binary of a native app version
│   ├── run                         [=== Run android/ios native apps ===]
│   │   ├── android                 Run current react native app on android (standalone)
│   │   ├── ios                     Run current react native app on ios (standalone)
│   ├── vm                          [=== React native app environment version management commands ===]
│   │   ├── ls                      List all currently installed environments
│   │   ├── install                 Install a specific environment
│   │   ├── uninstall               Uninstall a specific environment
│   │   ├── use                     Use a specific environment (switch to it if not current)
│   ├── publish                     [=== React native app publication commands ===]
│   │   ├── compat-check            Check for compatibility of current react native app with native apps
│   │   ├── ota                     Publish the current react native app as an OTA update
│   │   ├── inapp                   Publish the current react native app in a given in-dev native app (non OTA)
│   ├── container                   [=== ERN container specific commands ===]
│   │   ├── version                 Display the version of the container used by this miniapp
│   │   ├── compat-check            Check compatibility of miniapp with used container version
│   ├── init                        Create a new react native miniapp
│   ├── apigen                      Run the api generator
│   ├── libgen                      Run the library generator
│   ├── help                        [=== Show this menu ===]
```

Note: The `electrode-react-native` command could also be invoked through its alias `ern` for brievity.

This client will also require an associated configuration, which could be stored in a hidden file name named `.electrode-react-native`.

## cauldron

Contains command to access and update the Cauldron.  
Usage of these commands is pretty straightforward as it reflects Cauldron API, documented above.  
For reference here are examples of all the commands :

```shell
> ern cauldron add nativeapp walmart
> ern cauldron add nativeapp walmart:android
> ern cauldron add nativeapp walmart:android:4.1
> ern cauldron add dependency walmart:android:4.1 depA@1.0.0
> ern cauldron add binary walmart:android:4.1 /path/to/android.apk

> ern cauldron del nativeapp walmart
> ern cauldron del nativeapp walmart:android
> ern cauldron del nativeapp walmart:android:4.1
> ern cauldron del dependency walmart:android:4.1 depA

> ern cauldron get nativeapp walmart
> ern cauldron get nativeapp walmart:android
> ern cauldron get nativeapp walmart:android:4.1
> ern cauldron del dependency walmart:android:4.1
```

## native-app

Contains subcommands related to native applications.

#### publish-binary

**Publishes a native app binary to the cauldron**

**electrode-react-native publish-binary |app| |platform| |version| |binaryfilename|**

This command will publish to the cauldron, a native binary associated to a given native application platform and version.

It could be run either manually by an integration developer working on a current react native application integration within a native host application and generating the native binary on his/her workstation. Or in a more advanced environment it might be triggered by the CI system once a native app build is complete. In both cases, once the native application binary is published, it is immediately available for react native application developers to use.

What is the use of this native application binary ?  
As a react native application developer, I want to be able to experience & test (manually or with automation) my app within its native host application.
Therefore, I need a way to easily retrieve the binary of a given application for a specific platform and version.  
This is somewhat debatable because ultimately the ideal react native application environment should allow the react native application to be run in complete isolation of its host application. That being said, even within this "ideal" environment, the need to run the application within its host application might probably still be needed.

The native app binary will be automatically retrieved (if needed - then cached), whenever a user invokes the `run` subcommand (see below) to launch the native app. If a newest version of a binary is available (very probable if the version worked on is the current development one), the client will automatically download this newest version and let the user know of this update. However, it might be that the newest binary is incompatible with the current react native application. For example, if there is a binary native dependency version mismatch for one of the dependency between the native application and the react native application. In this case the client should also let the user know that this update was not install due to a version mismatch. It is then up to the developer to fix the issue.

Parameter | Mandatory | Description
--------- | ------- | -----------
app | YES | The name of the native application
platform | YES | The native application platform
version | YES | The version of the native application platform
binaryfilename | YES | The binary filename to be uploaded

> Sample usage

```shell
> ern native-app publish-binary walmart android 4.1 walmart-dev-debug.apk
```

#### run

**Run the native application**

**ern run |platform| [--app] [---version] [--local-packager]**

This command will launch the native app in an emulator or physical device. For an emulator, if will offer the user the choice of the avd image to use.

Parameter | Mandatory | Default | Description
--------- | ------- | ------- | -----------
platform | YES | | The native application platform
app | NO | * | The name of the native application
version | NO | list compatible versions | The version of the native app binary to launch
local-packager | NO | true | Should the local packager be started

> Sample usages

```shell
> ern run android --local-packager=false
```
*This command will retrieve the list of all android native applications compatible with the current react native app, and let the user select the one to use. It will not launch the local packager*

*Internally, this command will query the API to retrieve the app binary (APP or APK) at the given version and then execute necessary commands to launch the binary in an emulator / physical device*  

## vm (The following vm subcommands might be deprecated or replaced by a mecanism based on container base version (see [ern-container-base](https://gecgithub01.walmart.com/blemair/ern-container-base))

**Version manager for react native apps**

This command expose subcommands to allow a react native app developer to switch between react-native applications and versions.  
The top level versioning unit is the native app platform and version.

Why is there a need of a version management system somehow similar in spirit to [https://github.com/creationix/nvm](nvm) but used to switch between react native app versions ?  
Well, the use is mostly associated to OTA updates. Indeed, let's consider the following scenario :
I am a developer on a react native app humbly named `AwesomeReactNativeApp`. This app is now live in three different versions : `1.0.3`, `1.1.2` and `3.1.2`. Our team is currently working on the next `4.0.0` release. The major version number is different for all three versions, as a convention to indicate that these versions are not binary compatible (they rely on different native binary dependencies). Now let's say a bug is found and is present as far back as version `1.0.3`. Luckily for us, because we are using react native, we can use OTA updates to publish bug fixes for our app. The problem however is that we'll need to fix and test (manually or through automation) our bug fix for all currently live versions.  
Without the help of these commands, as a developer on the app, the workflow would prove to be very painful. If I stay within the same working folder, to fix a version, I would have to manually checkout on git the specific version (hopefully I work with a smart team and we use git tags for versioning), retrieve the associated host app binary for this specific version (otherwise I can't run it in the app) then clean my node_modules folder and launch npm install. Then finally I could make my bug fix, then test it, then rinse and repeat for all versions. I don't know for you, but I wouldn't want to be that guy.
Making the workflow a bit easier for developers is the motivation behind these commands, so that a developer can easily switch it's environment between different react native applications and versions.

EDIT : Due to the fact that multiple react native apps will be present in a given host native app, this process is a tad more complex. Indeed, if the bundle is served through the local packager running on the developer workstation, it should not only contain the target react native application but also all other react native applications part of the react native application "composite", and the root source JS source file (input of react native packager) should import all apps in this case. It is not very clear at this point how to solve this properly, once figured out, document will be updated accordingly.

*Internally a local hidden folder is used as a cache for all installed versions to avoid penalty of npm installing a given version over and over again*

#### ls

**ern vm ls**

List all the currently installed react native apps.

*Internally this will peek into the cache and list all versions of the app currently contained within the cache*

#### install

**ern vm install |reactnativeapp@version|**

Installs a given react native app environment

> Sample usage

```shell
electrode-react-native vm install react-native-cart@1.2.3
```

*Internally this command will look into the cache if the react native app is present at the given version. If not it will make a round trip to the server to retrieve the necessary and npm install into the cache. If react native app is already present in the cache, there will still be a query sent to the server to make sure that the cache version of the react-native-app is the latest for the given app/platform/version and download the newest one if any*

#### uninstall

**ern vm uninstall |reactnativeapp@version|**

Uninstall a given react native app environment

> Sample usage

```shell
ern vm uninstall react-native-cart@1.2.3
```

*Internally this command will just delete the necessary in the cache*

#### use

**ern vm use |react-native-app@version|**

Switch the environment to use a given react native app

> Sample usage

```shell
ern vm use react-native-cart@1.2.3
```

*Internally this command will clear the current working folder (only if there is no pending commits) and then will copy the whole content of the cache folder for this specific version to the working folder*

## publish

Contains sub commands related to react native apps publication.

#### compat-check

**Runs a binary compatibility check**

**ern publish compat-check [--app] [--platform] [--version] [--verbose]**

Parameter | Mandatory | Default | Description
--------- | ------- | ------- | -----------
app | NO | * | The native application to check compatibility with
platform | NO | * | The platform to check compatibility with
version | NO | * | The version to check compatibility with
verobse | NO | false | Verbose output (compatibility table)

This command runs a compatibility check to list what native app versions and platforms the current react-native app is deemed binary compatible with.

> Sample usage

```shell
ern compat-check
```  
*Check the binary compatibility of current react native application with all native applications indenpendtely of their platform or version. Output will not show compatibility table (verbose flag not present)*

```shell
ern compat-check --app=walmart --platform=android --verbose
```  
*Check the binary compatibility of current react native application with all versions of walmart android native application. Output will show compatibility table (verbose flag not present)*

It can be of use at different steps of the development lifecycle, but for the most part it could be run prior to publishing (either in-binary or ota) either manually or by one of the publication subcommands.

*Internally, this command will query the API to retrieve all native apps versions and native dependencies.  
For each native app version, it will then compare the native dependencies listed for the app, with the dependencies in the package.json of the current react-native app*

## libgen

**Generates the native library to be consumed by the host app**

**ern libgen |app| |platform| |version| [--verbose]**

Parameter | Mandatory | Default | Description
--------- | ------- | ------- | -----------
app | YES | * | The native application to check compatibility with
platform | YES | * | The platform to check compatibility with
version | YES | * | The version to check compatibility with

This commands runs the library generator for a given native app platform and version.  
It will query the cauldron to retrieve the list of all react native apps associated to this specific native application platform & version and will then do its magic, creating the bundle and the AAR. Finally it will either publish the AAR locally (maven local) or to a remote maven (configuration of cauldron should contain maven url / credentials). Same principle for iOS with Punic. It will also increment the version of the lib accordingly.

> Sample usage

```shell
ern libgen walmart android 4.1
```  
*Generate the library for walmart android version 4.1*
