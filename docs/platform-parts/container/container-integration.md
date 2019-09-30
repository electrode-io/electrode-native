This section describes how to integrate an Electrode Native container in your Android or iOS mobile application.

#### Android

A Container library can be added to a mobile Android application project in one of two ways:  

* By adding a dependency on the Electrode Native container AAR (recommended), or
* By directly adding the Electrode Native container module to the Android project (as a git submodule for example) 

You will also need to update your `build.gradle` files with the following:

- `jcenter` repository

We publish the `react-native` Maven artifact to `jcenter`. Therefore, you must make sure that `jcenter` is present in your list of repositories. The repositories are most commonly defined in your top-level project `build.gradle`.

```groovy
repositories {
  jcenter()
  //...
}
```

- resolution strategy

React Native includes some third-party libraries that might conflict with the versions you are using. For example, you might have issues with `jsr305`. If that is the case, add the following to your application module `build.gradle`

```groovy
configurations.all {
  resolutionStrategy.force 'com.google.code.findbugs:jsr305:3.0.0'
  //...
}
```

In addition to the above resolution strategy for handling the `jsr305` conflict, you might also run into a conflict with `OkHttp`. React Native depends on a specific version of the very popular networking library, `OkHttp`. If you are using this library in your application, you might be forced to align your version of `OkHttp` with the version included with the React Native version that you are using.  This is due to the current React Native design.

- okio linting

You might run into a conflict with the `okio` third party library which comes with React Native. It is a known issue. To resolve this issue, disable the lint check for `InvalidPackage`. You can also find solutions by searching for the `okio` conflict on the web.

```groovy
lintOptions {
  disable 'InvalidPackage'
  //...
}
```

##### Adding the Container as an AAR

If a Maven publisher has been configured in the Electrode Native cauldron, Electrode Native will package and publish the Electrode Native container project as a Maven artifact containing the AAR file(either to a local or remote Maven repository)

If you are implicitly publishing a container from a Cauldron (through a change in container content or the use of [cauldron regen-container] command), the Maven artifact will have the following data:

- Group ID : `com.walmartlabs.ern`
- Artifact ID : `{mobile-app-name}-ern-container`
- Version string : `{container-version}`

{mobile-app-name} is the name of the mobile application in the cauldron for the Electrode Native container that is being generated. For example, if the application name is `walmart`, the Electrode Native container artifact ID will be `walmart-ern-container`.

{container-version} is the version of the generated Electrode Native container. The container version can be in the form: `x.y.z` where x, y and z are integers. For example `1.2.3` is a valid container version. You can  specify a version for a Container or, by default, the current version will be patched-bumped to the new version.

To add a dependency on the Electrode Native container, in your mobile application add the following code to the `dependencies` object of your application module `build.gradle`. Be sure to substitute the `{mobile-app-name}` and `{container-version}` to represent your application.

```groovy
dependencies {
  api 'com.walmartlabs.ern:{mobile-app-name}-ern-container:{container-version}'
  //...
}
```

If you are explicitely publishing a container through the use of [publish-container] command, the Maven artifact id will be `local-ern-container`. The group id will remain the same though `com.walmartlabs.ern`. You can pass options to the command to change the artifact id and group id at your convenience. Please see [publish-container] documentation for more details.  
Also, if you use or plan to use a locally published Electrode Native container (to your maven local repository), make sure to declare `mavenLocal` in the list of repositories. This is located in the top-level project `build.gradle`.

```groovy
repositories {
  mavenLocal()
  //...
}
```

##### Adding the container as a Git submodule

Alternatively, you can include an Electrode Native container in a mobile application by adding it as an Android module. Although this is not the recommended way to add third-party dependencies (the container being one) to an Android project, it is however possible and this might be the best process if you don't have a remote Maven repository that you can publish the container to.

To add the container library as an Android module, add a GitHub publisher to the cauldron (or use [publish-container] with the `git` publisher option). Then, when a new Container version is published, Electrode Native will publish the resulting project to a private or public GitHub repository. It will create a Git tag for each version of a container.  You can then add the container Android module to your application project--managed as a Git submodule.  

**Note** Do not edit the code of the container if you use this procedure even though adding the Container directly in your project makes its code editable. The container code should not be modified manually, as any custom modification will be lost the next time the container is generated.

Be sure to include the module in your project `settings.gradle`, and add a `api project` directive to your application module `build.gradle`. Find more information on [declaring API and implementation dependencies](https://docs.gradle.org/current/userguide/java_library_plugin.html)

##### Configure Android build configuration versions
The following android build parameters can be configured with application specific needs.
- `androidGradlePlugin` - Android Gradle plugin adds several features that are specific to building Android apps. The version specified will update the top level `build.gradle` file.
    ```groovy
      dependencies {
        classpath 'com.android.tools.build:gradle:3.2.1'
    }
    ```

- `buildToolsVersion` - Android SDK build tools is a component of the Android SDK required for building Android apps. The version specified will update the app level `build.gradle`
    ```groovy
    android {
      buildToolsVersion "28.0.3"
    }
    ```
- `gradleDistributionVersion` - The url downloads the gradle wrapper. This allows executing Gradle builds without having to set up Gradle. The version specified here updates the `gradle/wrapper/gradle-wrapper.properties`
```
  distributionUrl=https\://services.gradle.org/distributions/gradle-4.6-all.zip
```
*NOTE: Check the compatibility chart of Gradle version required for each version of the Android Gradle plugin* [here](https://developer.android.com/studio/releases/gradle-plugin)

- `compileSdkVersion` - The API level designated to compile the application.

- `minSdkVersion` - The minimum API level that the application targets.

- `targetSdkVersion` - The designated API Level that the application targets

```groovy
  android {
    compileSdkVersion 28
    defaultConfig {
        minSdkVersion 19
        targetSdkVersion 28
    }
  }
```
- `supportLibraryVersion` - You may want a standard way to provide newer features on earlier versions of Android or gracefully fall back to equivalent functionality. You can leverage these libraries to provide that compatibility layer.

```grovy
  compile 'com.android.support:appcompat-v7:28.0.0'
```

You can configure `androidConfig` in the cauldron as show below. 

```json
{
  "containerGenerator": {
    "androidConfig": {
      "androidGradlePlugin": "3.2.1",
      "buildToolsVersion": "28.0.3",
      "compileSdkVersion": "28",
      "gradleDistributionVersion": "4.6",
      "minSdkVersion": "19",
      "supportLibraryVersion": "28.0.0",
      "targetSdkVersion": "28"
    }
  }
}
```

##### JavaScript Engine (RN 0.60 and above)

Starting with React Native 0.60, the JavaScript engine is distributed separately from the React Native AAR.
Also, prior to this version, JavaScriptCore was the only JavaScript engine that could be used on Android for React Native applications. Starting with this new version, it is now possible to use alternative JavaScript engines such as Hermes or V8.

Electrode Native currently support both JavaScriptCore and Hermes engines. 
By default, without explicit configuration, Electrode Native will use the non international variant of JavaScriptCore engine.

_JavaScriptCore_

With React Native 0.60.0, JavaScriptCore engine now comes in two variants : `android-jsc` and `android-jsc-intl`. The later is the international variant. It includes ICU i18n library and necessary data allowing to use e.g. Date.toLocaleString and String.localeCompare that give correct results when using with locales other than en-US. This variant is about 6MiB larger per architecture.

By default, the version of JavaScriptCore used by Electrode Native will be set to the latest version available at the time of Electrode Native version release and will be communicated in the release notes. The default JavaScriptCore variant will always be the non international one.

It is possible to change these defaults, using the `androidConfig` object of `containerGenerator` as shown below.  

```json
{
  "containerGenerator": {
    "androidConfig": {
      "jsEngine": "jsc",
      "jscVersion": "245459",
      "jscVariant": "android-jsc"
    }
  }
}
```

`jscVersion` is the version of the JavaScriptCore engine while `jscVariant` is the variant (`android-jsc` or `android-jsc-intl`).

_Hermes_

To use [Hermes](https://hermesengine.dev/) engine rather than JavaScriptCore, you should set the `jsEngine` in `androidConfig` to `hermes`.

```json
{
  "containerGenerator": {
    "androidConfig": {
      "jsEngine": "hermes",
      "hermesVersion": "0.2.1"
    }
  }
}
```

#### iOS

An Electrode Native container can be added as a dependency to an Xcode project in two ways:
* Use a dependency manager such as Carthage (CocoaPods will be supported in the future) or,  
* Perform a manual installation  

##### Using Carthage to add a container
To add a container using Carthage:  

1) Create a Cartfile if you don't already have one, or open an existing Cartfile.  
2) Add the following line to your Cartfile.

```bash
$ git "git@github.com:user/myweatherapp-ios-container.git" "v1.0.0"
```

3) Create a `Cartfile.resolved` file if you don't have one or open your existing `Cartfile.resolved` file.  
4) Add the following line to your `Cartfile.resolved` file:

```bash
$ git "git@github.com:user/myweatherapp-ios-container.git" "v1.0.0"
```

5) Install your dependencies using the following command:

```bash
$ carthage bootstrap --no-build --platform ios
```

##### Manually adding a container

To manually add a container:

1. Clone the container to `<Your-WorkSpace>`.

    ```bash
    $ git@github.com:user/myweatherapp-ios-container.git
    ```
2. Open your project in Xcode and right click on Libraries.
3. Select **Add Files** to `<your project name>`. Look for `ElectrodeContainer.xcodeproj` in the file directory where you cloned the repo above.

**Additional Configuration**

After installing the dependency, you will need to add additional configurations.

1. In Xcode, choose `<your project name>` from the Project Navigator panel.
2. Click `<your project name>` under TARGETS.
3. From the General tab, locate **Embedded Binaries** and click **+**
4. Select `ElectrodeContainer.framework` and click Add.
5. In Build Phases, verify that `ElectrodeContainer` is in Target Dependencies, Link Binary With Libraries, and Embed Frameworks.
