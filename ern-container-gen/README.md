### ERN Container Generator (WIP)

**!! Only supports Android target as of now !!**

This project represents a standalone command line tool (`ern-container-gen`) that can be used to generate a fully usable complete electrode container native library to be included and consumed by a host application.  

The resulting container will be versioned and contains everything that the native host application needs to load/interact with react native mini apps :

  - The electrode react-native container code surface, along with its initialization surface exposing configuration for all included configurable modules (i.e code-push, stacktracer ... whatever other native module used at least by one of the mini apps)
  - All third party native dependencies (plugins) needed by all mini apps (and native app)
  - Code surface to load mini apps and API code surface to either implement needed API(s) or consume mini-apps API(s) (of any API that was generated using [ern-api-gen](../ern-api-gen))
  - A few helper/utility classes
  - The mini-apps composite bundle (in case of straightforward single bundle containing all mini apps) and will later contain all the mini apps bundle(s) and common bundle (in case of multi bundle support).

It is making use of [mustache](https://mustache.github.io/) for templating needs, and [shelljs](http://documentup.com/shelljs/shelljs) for shell access.

This module can be launched standalone as a command line binary (`ern-container-gen`) but can also be included as a dependency to another node project ([ern-local-cli](../ern-local-cli) is consuming it this way).

It potentially supports different generators. For example for Android we have the `maven` generator, which generates the container as a versioned AAR library published to `maven`. For iOS we might have a `carthage` and/or `pod` generator(s). We could also have a generator that publishes the project to a github repo instead of packaging it inside a redistribuable library.

##### I/O

**Inputs**

| Name         | Description       | Required    | Default Value
|:----------:|:-------------:|:-------------:|:-------------:|
| nativeAppName | The name of the native application | YES |  |
| platformPath | Path to the currently activated platform version folder | YES | |
| generator | The generator to use | YES | |
| plugins | An array containing all plugins (to be included in the lib)| NO | []
| miniApps | An array of mini app objects (name/version) (to be included in the lib ) | NO | []
| verbose | Verbose output | NO | false

**Maven Generator (Android)**

For now only one generator targeting android is supported. It is the "maven" generator.

It takes the following parameters

| Name         | Description       | Required    | Default Value
|:----------:|:-------------:|:-------------:|:-------------:|
| containerPomVersion | The version of the container to publish to maven | YES | |
| mavenRepositoryUrl | The url to the maven repository where to publish the lib | NO | maven local
| namespace | The namespace/groupid to use for lib and plugins | NO | com.walmartlabs.ern

**Outputs:**
- The generated output of the generator, and also publication of it as an AAR to maven local or remote (in the case of the maven generator)

#### Current high level Android generation business logic (maven generator)

**Phase 1 : Plugins (third party libs here) publication**
- For each plugin part of the input :
  - Check cache to see if the plugin has already been published at this version (and with current react-native version). If not :
    - Retrieve library source based on config (either from npm or git)
    - Patch library source (mostly for publication and to make sure react-native version is correct) based on plugin config using mustache provided templates
    - Build library from source and upload/publish resulting lib as a maven artifact to maven local or remote (whatever mavenRepositoryUrl was provided)

**Phase 2 : Container generation**
- Copy container hull to output folder *hardcoded to ./out for now*
- Generate `ElectrodeReactContainer.java` file using mustache template and the list of all plugins (and their config)
- Copy each plugin hooking code (if any) to the plugins folder of the container
- Update `build.gradle` so that the container lib includes all third party dependencies (each plugin)
- Retrieve every react-native mini app from npm
- Create a single bundle/resources out of them (easy enough while waiting for multi bundle support)
- Store generated composite miniapps bundle to `/assets` and generated resources to `/res` in container generated project.
- Build the container.
- Publish resulting artifact at the specified version.
