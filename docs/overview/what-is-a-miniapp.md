## What's a MiniApp ?

You'll notice that throuhgout this documentation and within the platform itself, we use the term `MiniApp` quite extensively. It surely calls for a definition.

What exactly is a `MiniApp` ?

Well, a `MiniApp` is actually not much more than a JavaScript `React Native` 'application'. We made the choice to distinguish it from a full fledge application through this naming, considering that a `MiniApp` is actually not a whole application in its own, but can rather a small 'application' on its own that can be combined and composed with other `MiniApp(s)` to form parts of a mobile application.

A `MiniApp` can be shipped and updated inside a mobile application, either from wihin of a native `Container` (for non released mobile application versions) or as an over the air update (for released native application versions).

### Definition

```
A MiniApp is a JavaScript React native project representing a specific feature or component.
It can range from being a single simplistic UI component with minimalistic logic, to being a single page application with some business logic and communication with the native side, to a multi page application containing a whole applicative feature.
```

### As a JavaScript developper what does a MiniApp means to me ?

Well first of all, it means that there is no real change to your workflow or your potential current knowledge of `React Native`. You'll be still writing `JavaScript`, still using `React Native` and you'll be able to use any kind of third party `JavaScript` packages in your application. In terms of coding, developping a `MiniApp` is actually exactly the same as developping an application or component using `React Native` on it's own, without our platform. 

While your actual coding experience won't change, the tooling around it, will. Indeed, most of the commands you use directly from `React Native` CLI are replaced with ERN specific equivalent commands. 

For example, instead of running `react-native run-ios` to launch your `React Native` MiniApp inside an iOS simulator or real device, you will rather run it through `ern run-ios`. Instead of using `react-native start`, you'll use `ern start`. Most of these commands will actually ultimately invoke the underlying equivalent `react-native` commands, but they will perform some platform specific logic before-hand. Also you won't have to use `react-native link` command anymore, due to the fact that supported native dependencies will be automatically properly linked.

### As a mobile developper what does a MiniApp means to me ?

You won't directly have to deal with the JavaScript `MiniApps`. Selected `MiniApp(s)` will get packaged inside a `Container` library that you will then add to your mobile application project. The `Container` will then surface the different `MiniApps` that it includes, as native `Views` than you can then embed inside their own `Activities` on Android and `ViewControllers` on iOS, and launch when you see fit, based on your overall mobile application flow. 
Interactions, communication between the `MiniApps` and your mobile application will happen through APIs, also part of your `Container`, that can be consumed or implemented in your mobile application, in a way that is very intuitive mobile development friendly, leveraging compile time type safety.

### Current Caveats

**Navigation**

Our platform currently does not ship with its own navigation library nor reuse a specific navigation library. Navigation is a difficult problem to tackle with `React Native`. And when you start mixing mobile native screens with JavaScript React Native screens, and you must account for potential navigation from/to mobile views <-> react native MiniApps, as well as in between react native MiniApps themselves ... no to mention the fact that you need a solution that can work with many different mobile application code bases, the problem becomes even more complex !
The fact that we don't officially yet support any proper navigation mecanism, mostly means that, as of now, if you want your `MiniApp` to reach maximal reusability, maximal reach potential, you should consider writing 'single page' `MiniApp(s)` (i.e, `MiniApps` that are only composed of a single screen and do not involve navigation from screen to screen).
This recommandation does not apply to 'private' `MiniApp(s)` that might be used only within your own organization. In that case, you'll figure out a way to properly develop the `MiniApp(s)` in a such a way that integrates properly with your existing mobile application native navigation.

**Third party native modules**

On the one hand, our platform offer support for third party React Native `native modules` and do not require JavaScript React Native developpers to actually use any command to properly `link` native modules with their `MiniApp`. On the other hand, platform does not support all third party native modules all of the box. Each `native module` needs to be explicitely listed in the platform manifest and define some configuration around it, so that it can be properly injected in any `Container`. The good thing being that Electrode React Native master `Manifest` is a public GitHub repository, and is not bound to platform release lifecycle, meaning that anyone can contribute to it to add new `native modules` support for their own, as well as any other developer use !

**Code Push**

*Not saying anything here. This is a current problem for open sourcing but hopefully we'll make sure that it ain't one anymore before OS release. Just keeping this section in case ...*