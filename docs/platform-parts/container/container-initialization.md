This section describes how to initialize a container for the Android and iOS platforms.

#### Android

Before accessing MiniApps that are stored within an Electrode Native container, the container needs to be initialized.

Initialization of a Container should ideally take place during startup of your mobile application. If you are using a class extending Application, you should place the container initialization call in the `onCreate` method of this class. If you are not using an Application class to initialize all libraries used by your mobile application, you should place the container initialization code wherever appropriate. It's best to have it initialized as soon as possible.

The initialization of a container is done as a single call of the `initialize static` method of the `ElectrodeReactContainer` class.

```java
ElectrodeReactContainer.initialize(
    this /* Application instance */,
    new ElectrodeReactContainer.Config().isReactNativeDeveloperSupport(BuildConfig.DEBUG)
    /* Additional plugins configuration here */);
```

The first parameter to this method is the `Application` instance. In the sample call above, we use `this` as the call is made from an `Application` extending class.  
The second parameter is the configuration of the container and React Native. In the sample above, we enable React Native developer support. In the sample we make use of `BuildConfig.DEBUG` to enable developer mode for debug builds only. You can adapt it for your application needs.  

The `initialize` method might also contain additional parameters. Respectively, one parameter per plugin configuration. Not all plugins (APIs or third-party native modules) are configurable, so most of them (>90%) won't add an extra parameter to the initialize method. One configurable plugin is `react-native-code-push` for example, as you need to pass a `deployment key` to initialize this plugin, and it also has a debug mode that you can enable or disable.

#### iOS

Before accessing MiniApps stored within an Electrode Native container, you need to initialize the container. In iOS, we prefix our platform-specific files with `Electrode`.

Initialization of a Container should ideally take place during startup of your mobile application. Ideally it should take place in your `AppDelegate.m` in `didFinishLaunchingWithOptions:` method. Otherwise, you should call the container initialization wherever appropriate. It's best to have it initialized as soon as possible.

Initialization of Container is performed through the static method `startWithConfigurations:` of `ElectrodeReactNative`.  

```swift
	import ElectrodeContainer
```

```swift
    let containerConfig = ElectrodeContainerConfig()
    containerConfig.debugEnabled = RnDevSupportEnabled
    ElectrodeReactNative.start(withConfigurations: containerConfig)
```

```objectivec
	#import <ElectrodeContainer/ElectrodeContainer.h>
```

```objectivec
    ElectrodeContainerConfig *containerConfig = [[ElectrodeContainerConfig alloc] init];
    containerConfig.debugEnabled = RnDevSupportEnabled;
    [ElectrodeReactNative startWithConfigurations:containerConfig];
```

The first parameter is an implementation of the `ElectrodePluginConfig` protocol we provide through `ElectrodeContainer` that allows you to configure for both `ElectrodeContainer` and React Native. In the sample above we use `RnDevSupportEnabled`, a static boolean constant, to decide if developer support should be enabled or not. You can adapt it for your application needs.

The `startWithConfigurations:` method might also take additional parameters such as the implementation of `ElectrodePluginConfig` for additional plugins, depending on your plugin dependencies. Specifically, one parameter per plugin configuration.  
**Note** Not all plugins (APIs or third party native modules) are configurable, so most of them (>90%) won't add an extra parameter to the `initialize` method. One configurable plugin is `react-native-code-push` for example, as you need to pass a deployment key to initialize this plugin, and it also has a debug mode that you can enable or disable.

To learn more about configurable plugins, see [url](url)

