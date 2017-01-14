## Electrode React Native Platform (ern-platform)

#### Required prerequisites

**Yarn**

The platform is using [yarn](https://yarnpkg.com) packager manager (instead of npm).  
It is used for installing the platform and platform versions, and also used for container generation.

At some point we might make it optional and fall back to npm if yarn is not installed, but for now this is a requirement.

Yarn install is quite straightforward with [brew](http://brew.sh/).

```
brew update
brew install yarn
```

**Node**

The platform is running on [node](https://nodejs.org/en/) and has a node engine version requirement of `>=6.9.4` (current LTS version). Please make sure you are running a node engine matching this version requirement (you should use `nvm` if not already, to easily install and switch between node versions).

#### Optional prerequisites

If you need to work on the container generation for Android, you'll need to have all build tools installed. If you have Android Studio installed (and corresponding ENV variable paths correctly setup), you should be good to go.  
Otherwise, easiest way is to just install the latest version of [Android Studio](https://developer.android.com/studio/index.html).
If you don't need to work on Android container generation, do not bother.

#### Understanding platform structure

In order to work on the platform, you first need to understand how it's structured and the different projects that it is composed of.  
The platform repository contains 6 different node "projects", each one being in its own folder.  
If you need more details about these projects, they all have a README, feel free to take a look.

- [ern-api-gen](/ern-api-gen)  
The API generator. Used to generate API code (Android/JS as of now) on top of [react-native-electrode-bridge](https://gecgithub01.walmart.com/Electrode-Mobile-Platform/react-native-electrode-bridge) and package the code in a NPM module for redistribution.  
Meant to be invoked manually (or through CI) by a user through the command `ern generate api` to generate an API module based on a given schema.  
A user of the platform might or might not have to use this command (i.e this project). Only users that wish to generate an API will have use of this project.  
Only `ern-local-cli` has a dependency on `ern-api-gen`.

- [ern-cauldron-api](/ern-cauldron-api)  
The Cauldron server / REST service.  
Can be started locally or installed on an external server.  
No other projects have a dependency on `ern-cauldron-api`.

- [ern-cauldron-cli](/ern-cauldron-cli)  
A node client to access the cauldron.  
Only `ern-local-cli` has a dependency on `ern-cauldron-cli`.  

- [ern-container-gen](/ern-container-gen)  
Native container generator.  
Invoked through the the command `ern generate container`.  
Only `ern-local-cli` has a dependency on `ern-container-gen`.

- [ern-global-cli](/ern-global-cli)  
Ultra lightweight node module to bootstrap first time platform installation and from there on to relay all `ern` command invocations to the current local client (`ern-local-cli`) of the platform version in use.  
This project is the `ern` binary.
It is meant to be installed by a user that install the platform for the first time through `npm install -g electrode-react-native`.

- [ern-local-cli](/ern-local-cli)  
Command line client to access all platform features. There is one version of this client per version of the platform. New version might include bug fixes, new commands, improved commands etc ... Therefore from version to version of the platform, a user might expect variations in the exposed commands.

- [manifest.json](manifest.json)  
Holds the current platform version number as well as the list of supported plugins (and their versions) for this current version of the platform.  

- [install.js](install.js) and [uninstall.js](uninstall.js)  
Contains installations/uninstallation steps for this platform version.

#### Understanding platform versioning

Platform repository follows a specific convention for versioning, that the ern client relies on.

Each version is represented by a single digit version number which gets incremented for each new version.  
Each version is stored in a branch named `v[versionNumber]`, for example `v1`, `v2`, `v3` and so on.  
Each version is git tagged with a minor additional version number `v1.0`, `v2.0`, `v3.0`.

A new version will follow a `2 weeks release cycle`.   
A new version might contain new plugins support as well as version updates of already supported plugins but might also contains improvements/fixes to the tools part of the toolchain (ern-container-gen, ern-api-gen, ern-local-cli ...). It might also introduce new tools.

Eventually we might release "critical fix" version updates. This is where the minor versioning with the git tag comes in. For example, if a user using `v2` of the platform finds a big bug in the container that makes it unusable in his context, we might push a fix on the `v2` branch and git tag with `v2.1`. Then the platform update command will allow updating the `v2` version with this fix.  
Update to version should absolutely not include new dependencies or update dependency versions as it might break binary compatibility with users not running this update or already published apps. It should only fix deemed critical bugs, rendering the platform unusable in a given context.
We really don't want to do that, so hopefully it will not happen too much.

#### Understanding platform installation & version switching

A user installing the platform for a first time, will have to first globally install the `ern` binary.  
This is done by running `npm install -g electrode-react-native` (this is the [ern-global-cli](/ern-global-cli) project).

Then, when running `ern` for the first time, and assuming `v3` is the latest version of the platform, `ern-global-cli` will create in the following directory structure in the home user directory :

```
.ern
 |_ ern-platform (git repo)
 |_ cache
 | |_ v3
 |_ .ernrc
```

The `ern-platform` folder contains a `git clone` of `ern-platform` repository.  
The cache folder contains one folder for each installed version of the platform, containing the installed version. In this case as `v3` was the latest version, `ern` installed this version and created the correct folder.
The `.ernrc` file holds global platform configuration and also the version of the currently activated/in-use platform.

From there on, when running `ern` command again, it will still go through `ern-global-cli`, but this time, as it will detect that the `.ern` folder already exists in user home directory, it will now call in directly the `ern-local-cli` of the currently in-use version of the platform.  
To do that, it will look in the `.ernrc` file what is the currently activated version of the platform and will call the `ern-local-cli` present in the cache folder of the right version (in that case, for `v3` it will use `cache/v3/ern-local-cli/index.js`).

When the user wants to list all versions of the platform, `ern-local-cli` will just issue the `git tag` command in the `ern-platform` repo folder and return that info.

When the user wants to install a new (or old) version of the platform, let's say `v4`, `ern-local-cli` will run `git checkout v4` in the `ern-platform` repo and call the `install.js` script found at the root of the repo, which will copy the current repository (on `v4` branch) to a a new `v4` folder in the `cache` folder and will run `yarn install` for all of the tools.

When the user wants to switch from an installed version to another (let's say `v4` to `v3`), the platform `use` command will just update the `.ernrc` file to change the activated version number, then next time `ern` command is run, it will know from which cache version folder to consume `ern-local-cli`.

#### Development instructions

This is a work in progress pretty raw procedure, it does not handle versioning at all. It will surely get fine tuned / simplified over time as we improve the platform.  
The main goal here is to have as less "development environment" specific code as possible in the platform.  

**[First time steps]**
1. Make sure you have installed all the prerequisites listed above.
1. Git clone this repo somewhere on your workstation.
2. Install the global client through `npm i -g @walmart/electrode-react-native`.
3. Install platform by running `ern` command in a terminal

**[Dev steps]**
4. Start the Cauldron service locally (if its not already running) running `ern cauldron start` in a separate terminal window.  
5. Go to `ern-local-cli` folder where you cloned the repo, and run `npm install` from there.  
6. From within `ern-local-cli` folder run `npm link`. This will make `ern-cli` binary (representing `ern-local-cli` available globally).
7. Now, whenever you run `ern-cli` it will bypass global client and directly use your own `ern-local-cli`
