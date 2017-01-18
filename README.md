## Electrode React Native Platform (ern-platform)

#### Required prerequisites

**Yarn**

The platform is using [yarn](https://yarnpkg.com) packager manager (instead of npm).  
Yarn is being used for installing the platform and platform versions, but also used for container generation.

At some point we might make it optional for the user and fall back to npm if yarn is not installed, but for now this is a requirement.

Yarn install is quite straightforward using [brew](http://brew.sh/).

```
brew update
brew install yarn
```

**Node**

The platform is running on [node](https://nodejs.org/en/) and has a node engine version requirement of `>=6.9.4` (current LTS version). Please make sure you are running a node engine matching this version requirement (you should use `nvm` if not already, to easily install and switch between node versions).  
In the future we might have a lower node version requirement, but for now this is it !

**Walmart npm**

Due to the fact that node packages are currently walmart scoped, they are stored in our internal enterprise npm repository. If you haven't done so already, you'll need to setup npm accordingly. Please see [this confluence page](https://confluence.walmart.com/display/PGPTOOLS/NPM+and+Nexus) for instructions.  

#### Optional prerequisites

If you need to work on the container generation for Android, you'll need to have all build tools installed. If you have Android Studio installed (and corresponding ENV variable paths correctly setup), you should be good to go.  
Otherwise, easiest way is to just install the latest version of [Android Studio](https://developer.android.com/studio/index.html).
If you don't need to work on (or use) Android container generation, do not bother.

#### Understanding platform structure

In order to work on the platform, you first need to understand how it's structured and the different projects that it is composed of.  

The platform repository is currently composed of 7 different node projects.  
If you need more details about these projects, they all have a README, so feel free to take a look.  
All these projects (apart from `ern-local-cli`) can also be used and distributed as stand-alone projects. They are just kept in this repo for convenience considering their versioning will be aligned with platform versioning.

- [ern-api-gen](/ern-api-gen)  
The API generator. Used to generate API code (Android/JS as of now) on top of [react-native-electrode-bridge](https://gecgithub01.walmart.com/Electrode-Mobile-Platform/react-native-electrode-bridge) and package the code in a NPM module for redistribution.  
Meant to be invoked manually (or through CI) by a user through the command `ern generate api` to generate an API module based on a given schema.  
A user of the platform might or might not have to use this command (i.e this project). Only users that wish to generate an API will have use of this project.  
Only `ern-local-cli` has a dependency on `ern-api-gen`.

- [ern-cauldron-api](/ern-cauldron-api)  
The Cauldron server / REST service.  
Can be started locally or installed/started on an external server.  
No projects depends on `ern-cauldron-api`.

- [ern-cauldron-cli](/ern-cauldron-cli)  
A node client providing access to the cauldron.  
Only `ern-local-cli` depends on `ern-cauldron-cli`.  

- [ern-container-gen](/ern-container-gen)  
Native container generator.  
Invoked through the the command `ern generate container`.  
Only `ern-local-cli` depends on `ern-container-gen`.

- [ern-global-cli](/ern-global-cli)  
Ultra lightweight node module to bootstrap first time platform installation and to relay all `ern` command invocations to the local client (`ern-local-cli`) of the currently activated platform version.
This project is the `ern` binary.
It is meant to be installed by a user that install the platform for the first time through `npm install -g electrode-react-native`.  
No projects depends on `ern-global-cli`.

- [ern-local-cli](/ern-local-cli)  
The portal to the platform ! Command line client to access all platform features.
No projects depends on `ern-local-cli`.

- [ern-runner-gen](/ern-runner-gen)  
Runner native project generator.  
Generates android/ios native projects that are used to launch the miniapp in a standalone way.

- [manifest.json](manifest.json)  
Holds the current platform version number as well as the list of supported plugins (and their versions) for this current version of the platform.  

- [install.js](install.js) and [uninstall.js](uninstall.js)  
Contains installations/uninstallation steps for this platform version.

#### Understanding platform versioning

Platform repository follows a specific convention for versioning, that the `ern` client relies on.

Each version is :

- Represented by a single digit version number which gets incremented for each new version.  
- Stored in a branch named `v[versionNumber]`, for example `v1`, `v2`, `v3` and so on.   
- Git tagged with a minor additional version number `v1.0`, `v2.0`, `v3.0`.  

Versions will follow a `2 weeks release cycle`.   

A new version might contain new plugins support as well as version updates of already supported plugins but might also contains improvements/fixes to the tools part of the toolchain (ern-container-gen, ern-api-gen, ern-local-cli ...). It might also introduce new tools and new commands.  

Given this versioning, if a native application version is using `v3` of the platform let's say, then ANY miniapp or component out there internally or in the wild, having a version that supports platform `v3` will be compatible with the native app and can be very easily integrated in it using the container generator.  

There is however one important thing to note : all supported plugins will be plugins that are PUBLIC. Plugins that are private to a company, not open-sourced in any way shouldn't be added to the list of supported plugins.  
Companies that wish to use private platform plugins should therefore fork this repository and add/maintain their own supported internal plugins.  
The good thing is that while miniapps that are created on this internal platform version cannot be redistributed to be integrate in platform native apps, the opposite is true. Meaning that a native app running platform `v1-mycompany` will be able to use any public miniapp/component that is on official platform `v1`. That is, if they don't modify the supported official plugin list for `v1` but just adds their own internal plugins to it.

Eventually we might release "critical fix" version updates that can't wait on a next official version release. This is where the minor versioning with the git tag comes in. For example, if a user using `v2` of the platform finds a big bug in the container that makes it unusable in his context, we might push a fix on the `v2` branch and git tag with `v2.1`. Then the platform update command will allow updating the `v2` version with this fix. Update process yet to be defined.
Update to version should absolutely not include new dependencies or update dependency versions as it might break binary compatibility with users not running this update or already published apps. It should only fix bugs that are deemed critical, rendering the platform unusable in a given context.
We really don't want to do that, so hopefully it will not happen too much.

**Dev info**
As of now, because we have no versions released yet (we're working on `v1`, I have created/published to a branch a `v0`. Indeed, to properly test initial platform install / version switch / etc ... we need to have at least one version published. We will maintain it needed during dev of `v1`. Once `v1` is published, then we will get rid of this testing env `v0`.

**React Native miniapp/component developer info**
For the developers of a react native miniapp using the platform, the best approach is to maintain one branch per platform version in their repository. This way, if we consider that the current in dev version of the miniapp is targetting `v4` of the platform but a live version is already running on `v3` for some users, then if developers need to make a bug fix to the live version using `v3`, they can easily switch to the `platform-v3` branch of their app, then switch the platform version to `v3` using `ern plaform use 3`, make their fix, test it and then publish OTA through `ern miniapp publish ota` command.

#### Understanding platform installation & version switching

A user installing the platform for a first time, will have to first install the `ern` binary.  
This is done by running `npm install -g electrode-react-native` (this is the [ern-global-cli](/ern-global-cli) project).

Then, when running `ern` for the first time, and assuming `v3` is the latest version of the platform, `ern-global-cli` will create the following directory structure in the user home directory :

```
.ern
 |_ ern-platform (git repo)
 |_ cache
 | |_ v3
 |_ .ernrc
```

- `ern-platform` folder contains a `git clone` of `ern-platform` repository.   
- `cache` folder have a folder for each installed version of the platform, containing the installed version. In this case as `v3` was the latest version, `ern` installed this version and created the correct folder.
- `.ernrc` file holds global platform configuration and also the version of the currently activated/in-use platform.

From there on, when running `ern` command again, it will still go through `ern-global-cli`, but this time, as it will detect that the `.ern` folder already exists in user home directory, it will now proxy the `ern` calls to the `ern-local-cli` of the currently in-use version of the platform.  
To achieve that, it will look in the `.ernrc` file what is the currently activated version of the platform and will call the `ern-local-cli` present in the cache folder of the right version (in that case, for `v3` it will use `cache/v3/ern-local-cli/index.js`).

When the user wants to list all versions of the platform, `ern-local-cli` will just issue the `git ls-remote --heads` command to list all remote branches (each version has its own branch) and extract the versions from there. The good thing here is that this command will always reflect the available versions, no need to update repo.

When the user wants to install a new (or old) version of the platform, let's say `v4`, `ern-local-cli` will run `git checkout v4` in the `ern-platform` repo and call the `install.js` script found at the root of the repo, which will then copy the current repository content (of `v4` branch) to a a new `v4` folder in the `cache` folder and will run `yarn install` from within it.

When the user wants to switch from an installed version to another (let's say `v4` to `v3`), the platform `use` command will just update the `.ernrc` file to change the activated version number, then next time `ern` command is run, it will know from which cache version folder to consume `ern-local-cli`.

#### Development instructions

This is a work in progress procedure. It will get fine tuned over time as we improve the platform.  
The main goal here is to have as less "development environment" specific code as possible in the platform. The following procedure requires absolutely no dev environment variable nor any specific dev environment code in the platform.

The trick is that the `manifest.json` of master branch declares version 1000. This dev setup just setup the cache for this version to point directly to your working folder holding `ern-platform` repository (using a symlink). Through the eyes of the platform, this is just a version like any other one. It won't be however listed as one of the versions available because the list of available versions is infered from looking at the remote branches. `v1000` is not a remote branch, so the version won't appear. Consider it as a "hiden" version. You can however activate/use it through `ern platfom use 1000`.

1. Make sure you have installed all the prerequisites listed above.
2. Install the global client through `npm i -g @walmart/electrode-react-native` (this will install the `ern` binary and make it available globally).
3. Install the platform by running `ern` command in a terminal (this will install the latest version of the platform, whichever it might be).
4. Git clone this repository somewhere on your workstation (we recommend you fork it first !) and `cd` into it.
5. Run `yarn install` (to install all dependencies)
6. Run `npm run setup-dev` (this will create the `v1000` development version properly)
7. Run `ern cauldron start` in a separate terminal window to launch the cauldron locally (or use `ern platform config` to set a remove cauldron url). If you want to keep the cauldron data after cauldron restart, make sure to run `ern cauldron start` within a dedicated folder as the cauldron database (a json document) will be stored wherever this command is run from.

From there on, you are good to go for development. You can switch the current platform version to `v1000` by running `ern platform use 1000`. You can use the platform as if you were a user, trough `ern`, you can install versions, switch to versions, access the cauldron ...  
Be conscious however that of course if you switch to a version that is not the development one (let's say `v3`), then whenever you'll use `ern` command it will not go through your local repo code. Only when you are on `v1000` will `ern` point to your local repository.

We always work on `master` branch for the in-development version. Branch off master with your work and issue a PR to master when ready. Once version is ready we cut off a new branch from master for the version (for ex `v5`), we update the version number in the manifest for this branch (from `v1000` to `v5`) and we publish the branch. As soon as the branch is published to the remote, it will appear whenever a user list the platform versions.

If you want to add a new dependency to a project (`ern-api-gen` or `ern-local-cli` or whatever) or if you want to update a version, please use the `yarn add` and `yarn upgrade` commands in replacement of npm as projects maintain a `yarn.lock` file. You can read more about the usage of these commands [here](https://yarnpkg.com/en/docs/managing-dependencies).
Also, if you add a new dependency to a project, make sure to also include it in the root [package.json](package.json) file of `ern-platform`.

If you add or remove new commands, or add or remove features to any of the projects, please make sure to update the appropriate README documentation accordingly and include it as part of your PR.

#### TODOS

**Required for demo**

If you pick up work from this TODO list, please add your initials next to the task and link to the JIRA associated task (you'll need to create a JIRA task beforehand on our [JIRA board](https://jira.walmart.com/browse/EMP)). Remove from this TODO list once complete.   
Push updated README directly to master (no PR for this !).

`ern-local-cli`

- [New feature] Add `ern miniapp publish ota` command (ota publish through codepush)
- [New feature] Add `ern miniapp run ios` command (to run the miniapp in standalone runner on iOS)
- [Improvement] `ern miniapp init` should trigger standalone runner project generation for iOS.

`ern-cauldron-api` / `ern-cauldron-cli`

*None*

`ern-api-gen`

- [Improvement] Integrate with `ern-model-gen` for model generation. [BL] [EMP-191](https://jira.walmart.com/browse/EMP-191)
- [Improvement] Add support for array type in event payload.
- [New feature] Complete iOS api code generation

`ern-model-gen`

- Figure out where to store and how to package this project in the platform as it is a platform wart (only project not being developed internally and not a JS project). [BL] [EMP-190](https://jira.walmart.com/browse/EMP-190)
- [New feature] Add iOS model generation

`ern-runner-gen`

- IOS project generator implementation

`ern-container-gen`

- [New feature] Add an iOS generator that can be used in the context of the demo

`react-native-electrode-bridge`

- [Refactor] Rename to `react-native-electrode-bus`
- [Todo] Merge Cody's code containing iOS implementation

`Demo - APIs`

- Update APIs to make use of model generator to generate the Todo model (needs to be Parcelable probably on Android). For now APIs are working, using just a String to represent a TODO, which is working fine and is a good working backup solution if model gen is not ready/integrated in due time.

`Demo - Miniapps`

- Create initial todo miniapp (demo starter)
- Create initial helloworld miniapp (demo starter)
- Create the finished todo miniapp using generated todo api
- Create the finished hello world miniapp

`Demo - Native application`

- [Android] Create project containing the two screens (demo starter) [KS] [EMP-198](https://jira.walmart.com/browse/EMP-198)
- [iOS] Create project containing the two screens (demo starter) [BM] [EMP-180](https://jira.walmart.com/browse/EMP-180)
- [Android] Use generated container containing both miniapps and apis to implement full complete working demo application (to validate everything works together)
- [iOS] Use generated container containing both miniapps and apis to implement full complete working demo application (to validate everything works together)

`Demo - Rehearsal`

- Starting with the demo starters projects (native & miniapps), walk through all demo steps until reaching the end of the demo properly.

**Roadmap (not required for demo)**

`ern-platform`

- [Thought] Instead of using a dedicated manifest.json file we might just be better to store all this data in a specific section in the platform package.json (simpler to maintain a single file and all probably more coherent). (Counter arguments ?). If we decide it's a better solution, should be done before v1 release as it would require an update to the global cli.

`ern-local-cli`

- [New feature] Add `ern miniapp upgrade <platformVersion>` command
- [New feature] Add `ern platform fix <platformVersion>` command
- [Improvement] Only show banner / help whenever command is invalid/incomplete
- [Improvement] Show compatibility table (verbose mode) when checking for platform compatibility (for now only done when checking for native app compatibility).
- [Improvement] Show help whenever a command is mistyped (for now it just shows the banner)

`ern-cauldron-api` / `ern-cauldron-cli`

- [Improvement] Command line should accept an optional argument to specify the port on which to start the cauldron
- [Fix] Check out thread safety. Db is stored as a local file, what happens if two users try to write to it at the same time ?
- [Improvement] Consider using a more robust database for storage.

`ern-api-gen`

- [New feature] Support multi-parameter requests.
- [Improvement] Add array support for request/event payload

`ern-model-gen`

- [Improvement] Use JOI schema as JS model validator.
- [Improvement] Add support for data constraints.

`ern-runner-gen`

- TBD

`ern-container-gen`

- [Refactor] Generators source should be stored in a `generators` folder with one source file per generators
- [Refactor] Split up main code into more granular modules
- [Refactor] For each plugin, keep a separate folder per platform/generator (right now all plugins config/templates are stored at the root).
- [Improvement] For maven generator, most of the templates are to replace single values. Try to detect more automatically and do surgical patching instead of relying on big redundant templates.
- [Improvement] Add multi bundle support.
- [Improvement] Implement caching of bundled miniapp (might not be needed)
- [Improvement] Mavent generator. Find a better way to handle dependencies build order (react-native neds to be built first, then bridge which depends on it, then apis which depends on bridge ...). For now plugin list defines order but we might face issues later on.
- [Improvement] Maven generator. Figure out a better way to handle same version of dependency but built with a different react-native version dependency. For now we suffix the maven artifact version with the platform version, but its not ideal.

`react-native-electrode-bridge`

- TBD

`cross-components`

- [Improvement] Platform manifest should holds additional metadata for supported plugins, being the plugin platform. Some plugins contain cross-platform code (JS/Android/iOS i.e react-native-code-push), while some others only contain JS/iOS or others just native code (react-native-stack-tracer is Android only). For the latest, it's not really a plugin anymore but solely a native dependency. Manifest should be updated, but also the plugins related command of local client, so that it lists the platform supported by the plugin, and don't list the native only plugins.

- [Improvement] Be less strict on the node version required. Not for developers, but for consumers. Use babel to transpile to lower node version (most of the project already have some scripts to transpile).

- [Improvement/Fix] Do not require yarn. strongly recommend usage of it (and suggest to install it in a console message) but fallback to npm if yarn is not installed locally. This require to find a solution for single bundling in container generation. Yarn works out of the box as it flattens dependencies but for npm only solution I found was to run `npm dedupe` which takes dozen of minutes to run.

- [Improvement] Handles source maps correctly. Meaning that they should be generated during bundling somehow and stored in the cauldron. Next step will be to offer a tool to map non symbolicated stack trace to correct symbolicated stack trace using the source map stored in the cauldron (might be integrated later on with Crashlytics but that's another thing)
