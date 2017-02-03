# Electrode React Native (ern) local client

This command line client is the portal to the platform and all of its tools.  

Depending of the user infrastructure and development lifecycle this command line client will be used by different actors. In an environment without any CI platform, all commands of this client might be executed directly on a developer workstation, while in a more structured/larger development environment with a CI platform, some of these commands might get triggered and executed by the CI platform.

## ern commands tree

```
├── ern
│   ├── cauldron                    [=== Cauldron client ===]
│   │   ├── add                     [--- Add stuff to the cauldron --]
│   │   |   ├── binary              Add a native app binary
│   │   |   ├── dependency          Add a native app dependency
│   │   |   ├── miniapp             Add a miniapp to the cauldron
│   │   |   ├── nativeapp           Add a native application
│   │   ├── del                     [--- Remove stuff from the cauldron --]
│   │   |   ├── dependency          Remove a native dependency
│   │   |   ├── nativeapp           Remove a native application
│   │   ├── get                     [--- Retrieve stuff from the cauldron --]
│   │   |   ├── binary              Get the binary of a native app version
│   │   |   ├── dependencies        Get native dependencies info
│   │   |   ├── nativeapp           Get a native application info
│   │   ├── start                   Start the cauldron service
│   ├── generate                    [=== Generation related commands ===]
│   │   ├── api                     Generates an API package using ern-api-gen
│   │   ├── container               Generates a native container using ern-container-gen
│   │   ├── model                   Generates native models using ern-model-gen
│   ├── miniapp                     [=== MiniApp development related commands ===]
│   │   ├── init                    Creates a new miniapp
│   │   ├── compat                  [--- Binary compatibility checking --]
│   │   |   ├── nativeapp           Check binary compatibility of miniapp with a native app version
│   │   |   ├── platform            Check binary compatibility of miniapp with a platform version
│   │   ├── plugins                 [--- Plugins management --]
│   │   |   ├── add                 Add a plugin to the miniapp
│   │   |   ├── list                List the plugins used by the miniapp
│   │   ├── run                     [--- Run the miniapp ! --]
│   │   |   ├── android             Run the miniapp in the android runner
│   │   ├── upgrade                 Upgrade the miniapp to a platform version (TBD)
│   ├── platform                    [=== Platform management ===]
│   │   ├── config                  Get or set platform configuration value(s)
│   │   ├── current                 Show the current platform version number
│   │   ├── install                 Install a platform version
│   │   ├── ls                      List platform versions
│   │   ├── plugins                 List platform supported plugins
│   │   ├── uninstall               Uninstall a platform version
│   │   ├── use                     Switch to a platform version
│   ├── help                        Show help
```

This client depends on [ern-api-gen](../ern-api-gen), [ern-cauldron-cli](../ern-cauldron-cli) and [ern-container-gen](../ern-container-gen) projects.   

## commands walkthrough  

This section will dive into each command.  

At any time, when using `ern`, if you need help for a command, you use the hyphenated option `--help`.  
For example `ern generate api --help`.  
If you forget to pass any mandatory positional arguments to the command, the help will be displayed automatically.  

**napSelector ?**

You will notice that many of the commands are taking a `<napSelector>` argument.  
`napSelector` is the abbreviation for `native application selector`.   
It is a string formatted the following way `{nativeAppplicationName}:{platform}:{version}`.  
It can be either partial (not all placeholders provided), for example `walmart:android` or just `walmart`, or it can be full/complete (all placeholders provided), for example `walmart:ios:7.0.1`.   

Some commands might accept a partial `napSelector` while some other require a full `napSelector` to be provided. Commands accepting only a complete `napSelector` will indicate this in the help of the command by stating `<fullNapSelector>`, whereas commands that don't require a full `napSelector` will just mention `<napSelector>`.  

**required vs optional command arguments**  

Required command arguments must be provided to the command. They are positional, meaning that they come in a specific order. In the command help, required command arguments follow the naming convention `<required>`.  
Optional command arguments do no need to be provided to the command, they follow the naming convention `[optional]` in the command help and can be provided as hyphenated options.

### cauldron

Contains commands to access and update the Cauldron.  
For reference here examples of all the commands :

**Add a native application**

`ern cauldron add nativeapp <napSelector> <platformVersion>`  

This commands needs to be run each time a new native application version is started.  
It accepts a partial `napSelector`, even though most of its usage will rely on a full `napSelector`.
Platform version also needs to be provided.

```shell
> ern cauldron add nativeapp walmart 3
> ern cauldron add nativeapp walmart:android 3
> ern cauldron add nativeapp walmart:android:4.1 3
```

**Add a native dependency to a native application**

`ern cauldron add dependency <fullNapSelector> <dependency>`  

A `fullNapSelector` needs to be provided for this command, as adding a native dependency can only target a single version of a native app (for now).  

```shell
> ern cauldron add dependency walmart:android:4.1 depA@1.0.0
```

**Add a binary to a native application**  

`ern cauldron add binary <fullNapSelector> <path>`  

A `fullNapSelector` needs to be provided for this command, as each version of a native application has its own binary.  
The `path` should be an absolute/relative path to the binary to add (APK or APP).

```shell
> ern cauldron add binary walmart:android:4.1 /path/to/android.apk
```

**Add a miniapp to a native application**

`ern cauldron add miniapp <fullNapSelector>`  

A `fullNapSelector` needs to be provided for this command, as adding a miniapp can only target a single version of a native app (for now).  
This commands must be run from the root of a miniapp folder, as it will add this miniapp to the cauldron.  
Later improvement to the command might allow to pass a miniapp name and version as a string instead.  

```shell
> ern cauldron add miniapp walmart:android:4.1
```

**Remove a native application**

`ern cauldron del nativeapp <napSelector>`  

This command accepts a partial `napSelector`. If a full `napSelector` is provided, only the specific version of the native application will be removed. However is a partial `napSelector` is provided, for example `walmart:android`, then all versions of the walmart android native application will get removed from the cauldron.  

```shell
> ern cauldron del nativeapp walmart
> ern cauldron del nativeapp walmart:android
> ern cauldron del nativeapp walmart:android:4.1
```

**Remove a native dependency**

`ern cauldron del dependency <napSelector> <dependencyName>`  

A `fullNapSelector` needs to be provided for this command, as removing a native dependency can only target a single version of a native app (for now).    

```shell
> ern cauldron del dependency walmart:android:4.1 depA
```

**Retrieve cauldron entry for a native application**  

`ern cauldron get nativeapp <napSelector>`  

Retrieves the cauldron data associated to a given native application.  
A partial `napSelector` can be provided for this command. For example providing `walmart:ios` will retrieve the information for all versions of the walmart ios native application.

```shell
> ern cauldron get nativeapp walmart
> ern cauldron get nativeapp walmart:android
> ern cauldron get nativeapp walmart:android:4.1
```

**Retrieve cauldron entry of dependencies**  

`ern cauldron get dependencies <fullNapSelector>`  

A `fullNapSelector` needs to be provided for this command, as getting cauldron data for a native dependency can only target a single version of a native app (for now).    
This command will list all the dependencies used by a given native application version.

```shell
> ern cauldron get dependency walmart:android:4.1
```

### generate

**api**

`ern generate api [publishToNpm] [modelsSchemaPath]`  

This command can be used to generate a complete api package, containing JS/iOS/Android code that can be then consumed by native app and/or miniapps.  
A valid `apigen.schema` must be located in the folder wherever this command is run from.  
Optionally, the user can ask for the api package to be published to npm after generation, through the optional switch `publishToNpm` (alias `p`). By default, npm auto publication is disabled.
This command relies on [ern-api-gen](../ern-api-gen). For more details about the generation process and the structure of `apigen.schema`, feel free to go check it out.
By default, api gen will look for a models schema name `schema.json`. If you want to specify the path to a custom model file you can use the option `modelsSchemaPath`.

```shell
> ern generate api --publishToNpm
> ern generate api -p
> ern generate api
```

**model**

`ern generate model [schemaPath]`

This command can be used to generate models based on a JSON schema.

By default the model generator will look for a models schema file named `schema.json` at the root of where the command is exucted. You can provide your own path to a schema file to be used instead, using the `schemaPath` option.


**container**

`ern generate container <fullNapSelector> <containerVersion>`  

This command can be used to generate a native application container targeting a specific native application version.  
A `fullNapSelector` needs to be provided as well as a `containerVersion`, being the version of the generated container.  
While this command can be run directly by a user, in an enterprise environment, it will most probably be run by a CI platform.  
This command relies on [ern-container-gen](../ern-container-gen). For more details about the generation process, feel free to go check it out.   

```shell
> ern generate container walmart:android:4.1 1.0.0
```

### miniapp

All `miniapp` commands needs to be executed from the root of a miniapp folder (except the init command which actually creates the miniapp folder !)

**Creates a new miniapp**

`ern miniapp init <appName> [platformVersion] [napSelector] [scope] [verbose]`  

This command can be used to create a new miniapp.  
`appName` is the only mandatory argument, being the name of the application to create.  
`platformVersion` (alias `v`) can be provided to create a miniapp at a given platform version. If not provided, the miniapp will be created using the currently activated version of the platform.  
`napSelector` (alias `s`) can be provided to create a miniapp using the same platform version that is being used by a specific native application. If not provided, the miniapp will be created using the currently activated version of the platform.  
`platformVersion` and `napSelector` are mutually exclusive.  
`scope` can be provided to npm scope the package containing the miniapp. By default no scope is used.  
`verbose` flag can be specified if verbose logging output is wished during initialization.

The application will be created in a folder named after the `appName` provided, relative to where this command was executed.

For now, this command just executes `react-native init` command, using the react-native version supported by the platform version used. It will then pactch the `package.json` of the resulting created app adding the platform version and optionally the scope.

```shell
> ern miniapp init MyCoolMiniApp
> ern miniapp init MyCoolMiniApp -s walmart:android:4.1
> ern miniapp init MyCoolMiniApp -v 4 --scope walmart --verbose'
```

**Check binary compatibility of miniapp with a native application version**  

`ern miniapp compat nativeapp <napSelector> [verbose]`  

This command will check if the miniapp is binary compatible with a native application version.  
i.e it will check that all plugins used by the miniapp do exist in the native application version, and also that all versions of these plugins are matching.  
`napSelector` is a partial one. If `walmart:android` is provided for example, it will check the compatibility will all versions of the walmart android native application.  
`verbose` is an optional flag to ask for verbose output. If not provided, a single line will indicate compatibility or not with each native application version. If provided, a table with a breakdown of plugins/versions match/mismatch will be displayed for each native application version.  

```shell
> ern miniapp compat nativeapp walmart:android --verbose
> ern miniapp compat nativeapp walmart:ios:7.0.1
```

**Check binary compatibility of miniapp with a platform version**  

`ern miniapp compat platform [platformVersion]`  

This command will check if the miniapp is binary compatible with a platform version.  
i.e it will check that all plugins used by the miniapp do exist in platform version, and also that all versions of these plugins are matching.  
`platformVersion` (alias `v`) is optional, if not provided the compatibility check will be done with the currently activated platform version.  

```shell
> ern miniapp compat platform
> ern miniapp compat platform -v 3
```

**Add a plugin to a miniapp**

`ern miniapp plugins add <name>`  

This command will add a plugin to the miniapp. Miniapp developers should rely on this command to install plugins rather than directly through `yarn` or `npm` as this command will ensure that the plugin is supported by the platform version used, but will also make sure to use the correct version of the plugin to match the one supported by platform version.  

```shell
> ern miniapp plugins add react-native-code-push
>ern miniapp plugins add @walmart/react-native-electrode-bridge
```

**List all plugins used by the miniapp**

`ern miniapp plugins list`  

This command will list all the plugins currently used by the miniapp along with their versions.  

```shell
> ern miniapp plugins list
```  

**Run the miniapp in Android runner**  

`ern miniapp run android`

### platform

**Access and update platform configuration**  

`ern platform config <key> [value]`  

This command grants access to the platform configuration (stored in the `.ernrc` file).  
It allows to show the value of a given configuration key or set a new value for a given key.  
For now only `cauldronUrl` key is supported, allowing to get or set the url of the cauldron service.  
`key` is mandatory. `value` (alias `v`) is optional. If provided, the command will write the value for the corresponding key. If not provided, the command will retrieve and show the current value stored for this key.  

```shell
> ern platform config cauldronUrl
> ern platform config cauldronUrl -v http://localhost:3000
```

**Display the current activated platform version**  

`ern platform current`   

**Install a platform version**  

`ern platform install <platformVersion>`  

This command will install a given platform version (if not already installed) but will not switch to / activate it.  

```shell
> ern platform install 5
```

**List platform versions**

`ern platform ls`  

This command will list all platform versions. It will highlight the ones that are installed locally, the ones that are not installed locally as well as the currently activated version.

**List platform supported plugins**

`ern platform plugins [platformVersion]`  

This command will display the list of supported plugins (and their versions) for a platform version.  
`platformVersion` (alias `v`) is optional. If not provided, the current activated version of the platform will be used.  

```shell
> ern platform plugins
> ern platform plugins -v 5
```

**Uninstall a platform version**

`ern platform uninstall <platformVersion>`  

This command will uninstall a given platform version (if installed).  

```shell
> ern platform uninstall 5
```

**Switch to / activate a platform version**  

`ern platform use <platformVersion>`

This command will switch to / activate a given platform version.  
If the version is not installed, it will automatically install it and then activate it.  

```shell
> ern platform use 6
```

## Development info

`ern-local-cli` is tightly bound to the platform. To setup an appropriate development environment, please follow the instructions provided in the README of the [ern-platform](../) repository.  

`ern-local-cli` is powered by [yargs](http://yargs.js.org/) to offer all commands. You should familiarize yourself with yargs essentials.  
Each command is self contained in a single source file. Each subcommand is represented by a folder.  
All commands are stored in the [commands](./src/commands) folder.  
For example the command `ern generate api` will be found in `/src/commands/generate/api.js`.

All the source files are contained in the [src](./src) folder. This folder is breakdown in two subfolders : [commands](./src/commands) containing all commands implementation and [util](./src/util) containing utilities/BL that are used by the commands.  
As a general guideline, commands should contain as mininum BL as possible, all BL should be encapsulated in the utils.
