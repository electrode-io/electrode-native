## Electrode React Native Runner

Actually, to be more specific, there is not one, but two `Runners` part of the platform : one for `iOS` and one for `Android`. Both have the same role, they just do not target the same platform. We'll use the singular form, `Runner` throughout this documentation, as what will be said about it, applies to both platforms.

The `Runner` is a very simple and light mobile application project. It really does not contain much more than what you would get by creating a new application project in `Android Studio` or `XCode`. 

It is used to run your `MiniApp` standalone, so that you can effectively develop, debug, and test it, before releasing the first version, or new versions of it.

A `Runner` project will automatically be generated the first time you use `ern run-ios` or `ern run-android` command for your `MiniApp`. Relative to your `MiniApp` root directory, it will be generated in new `android` and `ios` directories.

Once the `Runner` project is generated, you can make manual code modifications to it, if needed, they won't get overwritten upon next execution of `ern run-ios` or `ern run-android` commands (only way to actually trigger a complete regeneration is to remove the `android` or `ios` directories).

Behind the scene, every time you run one of these commands, a new local `Container` will be generated to include your `MiniApp` along with all of its `native dependencies`. The `Runner` mobile application project just depends on this local `Container` and initalize it the same way any other mobile application would. Then it just asks the `Container` for the the `MiniApp` and launch it.

By default, when launching the runner through these two commands, a local `React Native Packager` will be launched and your `MiniApp` bundle will be served from this packager. This is the normal development workflow, but if you wish to serve your `MiniApp` directly from the `Container` stored within the binary of the application, these commands aceept options to take care of this.

### Related commands

- `ern run-ios` and `ern run-android`  
These commands will lauch a `MiniApp` in the `Runner` application. 

- `ern create-runner`  
This command can be used to generate a `Runner` project that is not bound to a single `MiniApp`. It should be of limited use.