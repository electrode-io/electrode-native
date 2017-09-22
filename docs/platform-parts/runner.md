## Electrode React Native Runner

The ERN platform contains two runners, one for each mobile platform (Android and iOS). Both runners are very simple and light-weight mobile applications--similar to new application projects in Android Studio or XCode.

The ERN runner application is used to run your standalone MiniApp so that you can effectively develop, debug, and test your MiniApp--before releasing a new or updated version of the MiniApp.

An ERN runner application is automatically generated the first time you use the `ern run-ios` or `ern run-android` commands for your MiniApp. Relative to your MiniApp root directory, the runner application is generated in new Android and iOS directories.

When the ERN runner application is generated, you can make manual code modifications to it, if needed--they aren't overwritten the next time you run the `ern run-ios` or `ern run-android` commands. The only way to trigger a complete regeneration of the ERN runner is to remove the Android or iOS directories.

Each time you run the `ern run-ios` or `ern run-android` commands, a new local container is generated to include your MiniApp along with all of its native dependencies. The ERN runner mobile application depends on the local container in order to launch the MiniApp.

By default, when launching the ERN runner using the `ern run-ios` or `ern run-android` commands, a local React Native Packager is launched and your MiniApp bundle is served from this packager. This is the normal development workflow. However, you can also serve your MiniApp directly from the container stored within the binary of the application using additional command options.

### Multiple MiniApp support

The ERN runner supports containers that include multiple MiniApps. However, since only one MiniApp can be launched when the ERN runner starts, you'll need to specify the primary MiniApp that should be launched when the ERN runner application starts.

### Related commands

- `ern run-ios` and `ern run-android`
Lauches one or more MiniApps in the ERN runner application.
