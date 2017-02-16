# Supported React Native Plugins

This platform version offers support for the following react native plugins

## [react-native-code-push](https://github.com/Microsoft/react-native-code-push)

```
ern miniapp add react-native-code-push
```

This plugin is required if you want to do OTA updates of your JS modules (miniapps, services).  
Native application will need to register to code push service (or Electrode OTA) to get a deployment key.  
For now there is no JS module granularity (not one key per miniapp/service) so there is a single key bound to the native application.  
Please follow instructions on [codepush.tools](http://codepush.tools/) to obtain a key.  
The deployment key needs to be provided upon native initialization of this plugin through plugin configuration.  

### Plugin native configuration

If this plugin is used, it's configuration needs to be provided in the call to `ElectrodeReactContainer.initialize`.

Android sample :

```java
new CodePushPlugin.Config("deploymentkey").serverUrl("optionalServerUrl").enableDebugMode(true|false)
```

- [REQUIRED] Deployment key
- [OPTIONAL] CodePush server url (default to Microsoft CodePush)
- [OPTIONAL] Debug mode (should be set to true for development, default to false)

## [react-native-stack-tracer](https://github.com/aoriani/ReactNative-StackTracer)

```
ern miniapp add react-native-stack-tracer
```

This plugin can be added if you are using `Crashlytics` in your native application and you want to get better reporting of exceptions thrown from the JavaScript side.  
Without using this plugin, all exceptions from the JS side would be reported in Crashlytics as a crash always happening at the same native code location (wherever react-native throw the exception on the native side).  
This plugin will make it better by recreating a proper JS stack trace which will improve reporting as different crashes are the correctly grouped together.  
**This plugin only targets Android platform.**

### Plugin native configuration

If this plugin is used, it's configuration needs to be provided in the call to `ElectrodeReactContainer.initialize`.

Android sample :

```java
new StackTracerPlugin.Config().enabled(true|false)
```

- [OPTIONAL] enabled : to enable/disable the plugin. By default it is enabled.

## [react-native-vector-icons](https://github.com/oblador/react-native-vector-icons)

```
ern miniapp add react-native-vector-icons
```

This popular plugin adds a ton of icons that can be used in your react native miniapp.  
This plugin does not require specific native configuration.

## [react-native-electrode-bridge](https://gecgithub01.walmart.com/Electrode-Mobile-Platform/react-native-electrode-bridge)

```
ern miniapp add @walmart/react-native-electrode-bridge
```

This plugin is a low level communication bridge to ease data transfer between JS/Native.  
It can be used standalone, but mostly it will be used inderictely through an API module (all API modules are using the bridge under the hood).  
If you are using an API module in your miniapp, the bridge will automatically be included in your miniapp.  
This plugin does not require specific native configuration.   