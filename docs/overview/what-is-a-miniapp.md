## What is a MiniApp?

A MiniApp is a JavaScript React Native application. That's mostly it!

We made the choice to distinguish a MiniApp from a full-fledged React Native application considering that a MiniApp is not a complete application on its own, but rather a "mini" application that can be composed with other MiniApps to form parts of a mobile application.

- A MiniApp is a JavaScript React native project representing a specific feature or component.
- A MiniApp can be a single, simple UI component with minimal logic or it can be a single page application that includes business logic and can communicate with the native side.
- A MiniApp can be a multi-page application containing a complete application feature.
- A MiniApp can be shipped and updated inside a mobile application, either included as a native container for in-development mobile application version or as an Over The Air (OTA) update for released mobile application versions.
- A MiniApp can be headless, meaning that it can only contain business logic that is invoked by the mobile application through exposed Electrode Native API(s).

### As a JavaScript developer, what does a MiniApp mean to me?

As a JavaScript developer, it means that there is no real change to your workflow or your current knowledge of React Native. You'll continue to write JavaScript, you'll continue to use React Native framework and, you'll be able to use third-party JavaScript packages in your application. In fact, developing a MiniApp is mostly exactly the same as developing an application or component using React Native on its own.

While your actual coding experience won't change, the CLI commands you'll interact with will be slightly different.
Some of the commands from the React Native CLI have been replaced with a few Electrode Native CLI commands.

For example, instead of running the `react-native run-ios` command to launch your React Native MiniApp inside an iOS simulator or real device, you will use the `ern run-ios` command.

Instead of using the `react-native start` command, you'll use the `ern start` command. Most of these commands will actually invoke the associated React Native commands, but the Electrode Native CLI commands perform additional platform-specific logic. Also, you won't have to use the React Native `react-native link` command due to the fact that supported native dependencies will be automatically linked.

### As a mobile developer what does a MiniApp mean to me?

As a mobile app developer, you won't directly deal with the JavaScript MiniApps. Selected MiniApps are packaged inside the Electrode Native container library that you'll add to your mobile application project. The container includes the MiniApps as native Views that you can embed inside their own `Activities` on Android and `ViewControllers` on iOS--and launch them when appropriate, based on your overall mobile application UX flow.

Interactions and communication between the MiniApps and your mobile application are conducted using APIs that are also part of your container. The APIs can be consumed in your mobile application in a way that is very intuitive and mobile-development friendly--while also leveraging a high degree of type-safety at compile time.

### Considerations and MiniApp recommendations

There are a few considerations and recommendations that you want to read about before using Electrode Native.

**Navigation**

- Because your MiniApps will be integrated in a mobile application, the navigation flow needs to be natively handled. Every new MiniApp has a dependency on [ern-navigation](https://github.com/electrode-io/ern-navigation).

**Third-party native modules**

- The Electrode Native platform offers support for third-party React Native native modules that do not require JavaScript React Native developers to actually use any command to properly link native modules with their MiniApp.

  However, the Electrode Native platform also does not support "all" third-party native modules. Each native module needs to be listed in the platform manifest and configurations must be modified so that the native modules can be properly injected into any container.

  Considering that the [Electrode Native master manifest](https://github.com/electrode-io/electrode-native-manifest) is a public GitHub repository, and is not bound to a specific platform release lifecycle--anyone can contribute to it in order to add new native module support for their own--as well as any other developer's use!
