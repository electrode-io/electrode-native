## CodePush commands

Electrode Native ships with a [CodePush] integration, to allow for releasing code updates over the air, to released native application versions.

A few commands are exposed by Electrode Native to release CodePush updates, promote releases and update existing releases distribution details. 

Please note that only JavaScript code can be updated through CodePush releases, not native code.

### Prerequisites

0. A Cauldron needs to be active

`code-push` commands only works with a supporting Cauldron. You should have properly setup and activated a Cauldron in order to work with CodePush.

1. Creating a CodePush account

CodePush was recently integrated into Microsoft App Center, therefore you'll need to follow instructions on [this page](https://docs.microsoft.com/en-us/appcenter/distribution/codepush/migrationguide) to setup an app center account.

After installing the App Center CLI and logging in through the CLI, please keep the generated token (a.k.a access key) handy, as Electrode Native needs it to perform `code-push` related commands. 

You'll then need to add the code push access key to the local Electrode Native configuration. This needs to be done local to each workstation/box that need to issue `code-push` commands. The CodePush access key is not stored in the Cauldron, for security reasons.

```shell
$ ern platform config codePushAccessKey YOUR_CODE_PUSH_ACCESS_KEY
```

2. Creating your application in CodePush

Once you are logged-in with the App Center CLI, you'll need to create your application in App Center. 

We recommend that you create two different application entries, for your application, one per platform. For example if your application is named `MyAwesomeApp`, you should create an application named `MyAwesomeAppIos` and another named `MyAwesomeAppAndroid`.

The name of the unsuffixed application should match the name you will use (or that you already use) in your Cauldron. For exmample, if you named your application as `MyCoolApp` in your Cauldron, you cannot use `MyAwesomeApp` for naming it in CodePush.

Refer to the App Center documentation for more details on the command, but for illustration, here are the commands we would run based on our imaginary application name:

```shell
$ appcenter apps create -p "React-Native" -o "iOS" -d "MyAwesomeAppIos"
$ appcenter apps create -p "React-Native" -o "Android" -d "MyAwesomeAppAndroid"
```

3. [Optional] Set the application names in your Cauldron configuration

If you have named your CodePush application as recommended, with a platform suffix (`MyAwesomeApp` -> `MyAwesomeAppIos` and `MyAwesomeAppAndroid`) then you don't have to do any specific configuration in the Cauldron as this convention will be used when running `code-push` commands. 

However, if you have used a different naming convention, for example if you name `MyAwesomeApp` Android as `MyAwesomeAppForAndroid`, you will need to specify the custom name in your Cauldron configuration. You should edit the `cauldron.json` file of your Cauldron manually, as we don't have commands yet to edit configuration in the Cauldron.

You should specify the custom application name in the `codePush` config object of the native application platform, as follow :

```json
"nativeApps": [
{
  "name": "MyAwesomeApp",
  "platforms": [
  {
    "name": "android",
    "config": {
      "codePush": {
        "appName": "MyAwesomeAppForAndroid"
      }
    }
  ...
```

4. Creating your CodePush deployment names

Think about deployment names as different deployment environments. You can choose as many deployment names as you see fit, though most users usually stick with the basic `Staging` and `Production` deployment names. 
You will get a different 'key' for each app name / deployment name combination.  
The keys are stored in your native application, and based upon the key you select at runtime, your native application will only retrieve the releases from a specific deployment name.

Refer to the App center documentation for more details on how to create deployment environments, but for illustration, here are the commands we would run for our `MyAwesomeApp` application, to create `Staging` and `Production` deployment names :

```shell
$ appcenter codepush deployment add -a MyAwesomeAppIos Staging
$ appcenter codepush deployment add -a MyAwesomeAppIos Production
$ appcenter codepush deployment add -a MyAwesomeAppAndroid Staging
$ appcenter codepush deployment add -a MyAwesomeAppAndroid Production
```

5. [Optional] Store the deployment names in your Cauldron

You need to pass a deployment name to all `code-push` commands. This deployment name can be provided as a command option, however if you'd rather like to be prompted for a deployment name to choose from, you can store the deployments names associated to a native application name/platform inside the Cauldron `codePush` configuration.

For illustration, here is how we would store the two deployments we created for our `MyAwesomeApp` Android in our Cauldron:

```json
"nativeApps": [
{
  "name": "MyAwesomeApp",
  "platforms": [
  {
    "name": "android",
    "config": {
      "codePush": {
         "deployments": [
            { "name": "Production" },
            { "name": "Staging" }
          ]
      }
    }
  ...
```

6. [Optional] Configure version name modifiers in Cauldron

Some native applications are using version name modifiers to distinguish between different environments. For example for our `MyAwesomeApp` on Android, we might use the version suffix `-qa-debug` to denote a debug version built for `QA` and `dev-debug` to denote a `Development` debug version. In this case, for any given version number (for example `1.0.0`) we can have three `variants` of the version : `1.0.0` (Production), `1.0.0-dev-debug` (Dev) and `1.0.0-qa-debug` (QA). 

The problem in that scenario, is that, when doing a release targeting a specific native application version, `CodePush` will only install it for versions matching the targetted version string. i.e if we are doing a CodePush release targeting `1.0.0`, then, users running the `1.0.0-dev-debug` version won't get the release.

If you are using version modifiers for your native application, then you should create an appropriate `codePush` configuration entry in your Cauldron.

For example, for your Android application, if `-dev-debug` versions are associated to your `Staging` deployment name and `-qa-debug` versions are associated to your `QA` deployment name, then you will end up with the following `codePush` configuration in your Cauldron :

```json
"nativeApps": [
{
  "name": "MyAwesomeApp",
  "platforms": [
  {
    "name": "android",
    "config": {
      "codePush": {
         "deployments": [{ 
              "name": "Production" 
            }, { 
              "name": "Staging",
              "modifier": "$1-qa-debug"
            }, {
              "name": "QA",
              "modifier": "$1-dev-debug"
            }
          ]
      }
    }
  ...
```

7. [Optional] Limit the number of CodePush entries in your Cauldron

For each CodePush release or promotion, a specific CodePush entry will be stored in the native application version in the Cauldron.

If you are doing a lot of CodePush releases, you might want to limit the number of CodePush entries stored in the Cauldron, to keep only the last X entries.

This can be achieved through Cauldron `codePush` configuration in the Cauldron top level `config` object. For example, if we desired to keep track of only the last two CodePush release entries for each native application version (per deployment name), our configuration would be as follow :

```json
"config": {
  "codePush": {
    "entriesLimit": 2
  }
}
```

By default, if not configured in Cauldron, all CodePush entries will be stored.

8. Setup code-push in your MiniApp(s)

For each of your MiniApp(s) that should support over the air updates, you should add the `react-native-code-push` dependency.

If not done already, add the `react-native-code-push` dependency to your MiniApp. 
From your MiniApp root directory, run the following command : 

```shell
$ ern add react-native-code-push
```

Then in your MiniApp, decorate your MiniApp `Component` class with `codePush`, as illustrated by the following sample :

```javascript
import codePush from "react-native-code-push";
[...]

class App extends Component<{}> {
  [...]
}

App = codePush({
  checkFrequency: codePush.CheckFrequency.ON_APP_RESUME,
  installMode: codePush.InstallMode.ON_NEXT_RESUME,
  minimumBackgroundDuration: 60 * 2
})(App);
```

You can use different values for `checkFrequency` or `installMode` based on your use case.

Refer to the official [code-push plugin documentation](https://github.com/Microsoft/react-native-code-push#plugin-usage) for more details.

9. [Native Application] Initialize the Container with the CodePush configuration

On the native side, as soon as you create a Container that includes at least in the native application code, you will need to initialize the Container with a `CodePush` plugin configuration. This configuration takes the `deployment key` to be used at runtime. This is at this step that you can select which deployment key to be used, based on the build type.

Here follows an illustration on how to initialize the Container with CodePush configuration on both Android and iOS.

**Android**

```java
ElectrodeReactContainer.initialize(
  [...]
  new CodePushPlugin.Config('DEPLOYMENT_KEY')
```

**iOS**

```objectivec
ElectrodeContainerConfig *containerConfig = [[ElectrodeContainerConfig alloc] init];
ElectrodeCodePushConfig *codePushConfig = [[ElectrodeCodePushConfig alloc] initWithDeploymentKey:@"DEPLOYMENT_KEY" serverURL:nil containerConfig:containerConfig];
[ElectrodeReactNative startWithConfigurations:containerConfig electrodeCodePushConfig:codePushConfig];
```

10. CodePush your first release !

Head over to the [code-push release] command documentation to do your first release through CodePush.

[code-push release] | Issue a CodePush release 
 
[code-push release]: ./release.md