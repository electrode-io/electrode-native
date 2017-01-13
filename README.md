## Electrode React Native Platform (ern-platform)

### Development Instructions

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

#### HOWTO development

TODO
