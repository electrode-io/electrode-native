At runtime, some native modules require additional configuration settings. For example, the `react-native-code-push` native module requires a deployment key upon initialization.

Configurable plugins have some source code associated to them in the manifest plugin configuration file in addition to the `config.json` file.

For each configurable plugin added to a container, an extra parameter must be added to the container initialization method that is called by the mobile application. This extra parameter allows the client code to pass the configuration of the plugin--at the time the container is initialized.

This section describes these source files for both Android and iOS.

#### Android

The following example describes an Android source file.

`{PLUGIN_NAME}Plugin.java`

In this example, the CodePush plugin file is named `CodePushPlugin.java`.

You can view the configuration in the current master manifest file located [here](https://github.com/electrode-io/electrode-native-manifest/blob/master/plugins/ern_v0.13.0%2B/react-native-code-push_v1.17.0%2B/CodePushPlugin.java)

The core of the source file is the `hook` method. The container invokes the `hook` method during initialization. The last parameter is the actual `Config` instance of the plugin as provided by the user when calling the `ElectrodeReactContainer` `initialize` method.

```java
public ReactPackage hook(@NonNull Application application, @Nullable Config config) {}
```

The `Config` class for the plugin is declared in the same `.java` source file. The class should follow the JAVA `builder` pattern. Mandatory configuration properties should be passed in the constructor, whereas optional properties should be provided using setter methods returning the `Config` instance to allow chaining.

#### iOS

The following example describes an iOS source file.

`Electrode{PLUGIN_NAME}Config.h` and `Electrode{PLUGIN_NAME}Config.m`

This example includes two `ObjectiveC` files for for CodePush plugin: `ElectrodeCodePushConfig.h` and `ElectrodeCodePushConfig.m`.

You can view the configuration in these files in the current master manifest file located [here](https://github.com/electrode-io/electrode-native-manifest/blob/master/plugins/ern_v0.13.0%2B/react-native-code-push_v1.17.0%2B/ElectrodeCodePushConfig.h) and [here](https://github.com/electrode-io/electrode-native-manifest/blob/master/plugins/ern_v0.13.0%2B/react-native-code-push_v1.17.0%2B/ElectrodeCodePushConfig.m).

A configuration class should use the `ElectrodePluginConfig` protocol.

The `(void)setupConfigWithDelegate: (id<RCTBridgeDelegate>)` method is called during the container initialization.
