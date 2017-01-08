### ERN Container Generator (WIP)

**!! Only supports Android target as of now !!**

This project represents a standalone command line tool (`ern-container-gen`) that can be used to generate a fully usable complete electrode container native library to be included and consumed by a host application.  

This library will be versioned and contains everything that the native host application needs to load/interact with react native mini apps :

  - The electrode react-native container, along with its initialization surface offering config for all included configurable modules (i.e code-push, stacktracer ... whatever other native module used at least by one of the mini apps)
  - All third party native dependencies (plugins) needed by all mini apps (and native app)
  - Code surface to load mini apps and API code surface to either implement needed API(s) or consume mini-apps API(s).
  - A few helper/utility classes
  - The mini-apps composite bundle (in case of straightforward single bundle containing all mini apps) and will later contain all the mini apps bundle(s) and common bundle (in case of multi bundle support).

It is making use of [mustache](https://mustache.github.io/) for templating needs, and [shelljs](http://documentup.com/shelljs/shelljs) for shell access.

This module can be launched standalone as a command line binary (`ern-container-gen`) but can also be included as a dependency to another node project ([electrode-react-native](https://gecgithub01.walmart.com/Electrode-Mobile-Platform/electrode-react-native) is using it this way).

##### I/O

**Inputs**

| Name         | Description       | Required    | Default Value
|:----------:|:-------------:|:-------------:|:-------------:|
| pathToContainerBase | Path to the container base folder | YES |  |
| pluginNames | An array containing all plugin names (to be included in the lib)| NO | []
| miniApps | An array of mini app objects (name/version) (to be included in the lib ) | NO | []
| generator | The generator to use | YES | |

For now only one generator targeting android is supported. It is the "maven" generator.

It takes the following parameters

| Name         | Description       | Required    | Default Value
|:----------:|:-------------:|:-------------:|:-------------:|
| containerPomVersion | The version of the container to publish | YES | |
| mavenRepositoryUrl | The url to the maven repository where to publish the lib | NO | maven local
| namespace | The namespace/groupid to use for lib and plugins | NO | com.walmartlabs.ern

**Details & Comments regarding some input(s)**

- **pathToContainerBase**   
This is the path to the local clone of [ern-container-base](https://gecgithub01.walmart.com/blemair/ern-container-base). Please take a look at this repo for more details, but basically it contains the container hull (base skeleton that will be patched and in which code will be injected) along with plugins config/templates/hooking code that will be injected during the container generation process.

The input are provided in two different ways, depending of the use of `ern-container-gen` in a standalone command line (binary) way or using it as part of another node application :  
If using `ern-container-gen` as a node module in another project, `ern-container-gen` exports a single function `ern-container-gen` which takes an object containing all the params.  
If using `ern-container-gen` command line, the config has to be stored in a json file (see [.libgenconf.sample.json](/libgenconf.sample.json) for a sample). Command line client user can specify a path to a specific config file by providing `--config-path` option on the command line. Otherwise, `ern-container-gen` command will look for a file name `.containergen.conf.json` in the folder where `ern-container-gen` is run from. The version of the generated container needs to provided in the command line as well through `--version`.

**Outputs:**
- The generated container library source, and also publication of it as an AAR to maven local or remote.

#### Current high level Android generation business logic

**Phase 1 : Plugins (third party libs here) publication**
- For each plugin part of the input :
  - Check cache to see if plugin has already been published at this version (and with current react-native version). If so :
    - Retrieve library source based on config (either from npm or git)
    - Patch library source (mostly for publication and to make sure react-native version is correct) based on plugin config using mustache provided templates
    - Build library from source and upload/publish resulting lib as a maven artifact to maven local or remote

**Phase 2 : Container generation**
- Copy container hull to output folder *hardcoded to ./out for now*
- Generate `ElectrodeReactContainer.java` file using mustache template and the list of all plugins (and their config)
- Copy each plugin hooking code (if any) to the plugins folder of the container
- Update `build.gradle` to compile all third party dependencies (each plugin)
- Retrieve every react-native mini app from npm
- Create a single bundle/resources out of them (easy enough while waiting for multi bundle support)
- Store generated composite miniapps bundle to `/assets` and generated resources to `/res` in Container project.
- Build the container
- Publish resulting artifact at the specified version

##### Usage

There is quite a lot of pre-requisites so it might not work for you. Anyway at this stage it's not really ready for roll-out ... but well, if you wanna try it it's up to you ;P

- **As a command line (binary)**

1) Clone this repo  
2) `npm install`  
3) `npm link` (to make ern-container-gen binary available globally)
4) Run `ern-container-gen` command from within a folder containing a valid `.containergen.conf.json` file (or provide your own through `--config-file` param)

- **As an imported node module**

1) `import ern-container-gen from '@walmart/ern-container-gen'`  
2) Call `libern-container-gengen` function passing in all needed params:

```javascript
function libgen({
    pathToContainerBase = required('pathToContainerBase'),
    generator = required('generator'),
    pluginNames = [],
    miniapps = [],
  }
```
