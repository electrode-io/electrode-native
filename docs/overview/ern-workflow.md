**-----------------------------------------------------------------------------------------------------------------**  
**EDITING REMARKS :** The following content should probably be lightened.
Some content might be extracted to be rather use in dedicated parts pages, or maybe we should break the different 
stages in different sub-sections in the TOC
**-----------------------------------------------------------------------------------------------------------------**

## The Electode React Native Workflow

`Electrode React Native` encapsulate a set of tools to streamline a complete mobile production line, from the development of MiniApps in React Native using JavasScript, to their actual delivery and integration in existing mobile application(s).

Any typical production line involves different types of "workers"/"actors", acting at different steps on the line, each having their own role and expertise.

In that sense, `Electrode React Native` is no different; and depending of the hat you're wearing, you will interact with a limited surface of the platform (i.e only use a few commands of the CLI).

From a bird's eye view, we can identify three high level "stages" in the `Electrode React Native` workflow, from start to finish. Each stage comes with its specific workflow items, as we will see.

Also, to each of the following stages we associate specific actors that should only have to deal with this specific stage.

That being said, this is just to give you an idea; this is not black and white; dependening on the size of your organization/team, and/or how you want to accomodate to your needs the `Electrode React Native` workflow, actors might deal with mutliple stages, or overlap on different stages.

### Stage 1 - `MiniApps` development *[JavaScript React Native developers]*

Everything starts with one or more `MiniApp(s)`. 

`MiniApps` will typically be developed by JavaScript developers, having some experience (or looking towards gaining experience) on front end applications written in JavaScript, using `React` or `React Native`. 

Seasoned React Native developers wont't actually feel much difference compared to their already known workflow for to the development of React Native applications. Indeed, as we will see, the workflow is pretty similar to the one offered by React Native, and most of the commands involved are the equivalent of some React Native commands.

This stage mostly involves the following workflow items :

- Creating a new `MiniApp` project through `ern create-miniapp` command (equivalent of `react-native init`)

- Adding needed JavaScript and/or native dependencies (platform APIs or supported third party native modules) to the `MiniApp` using `ern add` command. (equivalent of `yarn add` or `npm install`)

- Launching the `MiniApp` on its own, inside the platform `Runner` mobile application, in order to develop/debug and test the `MiniApp` standalone, using `ern run-android` and/or `ern run-ios`  commands (equivalent of `react-native run-android` / `react-native run-ios`)

- And of course, actually working on the implementation of the `MiniApp` itself, though this is not a platform specific workflow item  

If you are a `MiniApp` developer who just wants to open source a `MiniApp` to be used by any mobile application using `Electrode React Native`, this will probably be the only commands you'll have to deal with. If you want maximum reach for your `MiniApp`, you should also make sure to update the versions of the native dependencies it uses to align with the ones declared in our master `Mnaifest` upon every release of the platform (every 2 weeks). If your `MiniApp` is popular, the open source community might even do that for you ;) This can easily be achieved through `ern upgrade` command. 

All you are left with is publish your `MiniApp` version, and every update of it to npm, and let mobile applications use it.  

However, if you are creating `MiniApps` to be added only to a single target mobile application, or a very limited set of mobile applications (for example if you are creating non open sourced `MiniApps` to be only used for your company mobile application(s)), your workflow might involve more items, respectively :

- Launching/Debugging/Testing your `MiniApp` within the target mobile application(s) and not on its own in the platform `Runner`. It means that your `MiniApp` will probably co-exist with some other ones in the same mobile application. In that context, you will interact with the `ern link` / `ern unlink` and `ern start` commands to help you arround this use case.

### Stage 2. Adding/Updating `MiniApps` to/in a mobile application *[Release managers / Mobile application leads]*

This is the stage where you will hand pick the `MiniApp(s)` you wish to add to your moible application, and also deal with adding newer versions of those (i.e updating). 

Dependending on your organizational structure or desires, this stage might be handled by a dedicated release manager or mobile application lead, but it could also be handled by `MiniApps` developers themselves. This stage also includes shipping new versions of `MiniApp(s)` through over the air updates (`CodePush`).

THis is where most of the dependency versioning control aspect of the platform takes place, and where the `Cauldron`, `Manifest` and `Container Generator` are working hand in hand. This stage mostly involves interacting with `Cauldron` commands.

It encompass the following workflow items :

- Creating new native application versions in the `Cauldron`  
Through `ern cauldron add nativeapp` command   
You will have to do this for each new mobile application version for which development is getting started

- Adding/Removing/Updating `MiniApps` for a targets in-dev mobile application versions 
Through `ern cauldron add/del/update miniapps` commands

- Adding/Removing/Updating `native dependencies` for target in-dev mobile application versions   
Through `ern cauldron add/del/update dependencies` commands.  
Please note however that native dependencies that `MiniApps` directly depends upon, will be automatically added to the container when adding or updating a `MiiniApp` version to a given mobile application version.  
This workflow item is therefore limited only to native dependencies that no `MiniApps` are actually depending upon (mostly only to add standalone native `API implementations`).

- Updating the release status of mobile application versions
Through `ern cauldron update nativeapp` command.  
Flagging a mobile application version as being released, will actually 'freeze' the mobile application version, to disallow any new changes to the native dependencies (you cannot update native code over the air). It will activate `CodePush` for this mobile application version, allowing you to effectively push JS changes of `MiniApps` as over the air updates.

- Adding or updating `MiniApps` through over the air CodePush updates
Through `ern code-push` command.

### Stage 3. Integrating `MiniApps` in a mobile application *[Mobile application developers]*

This is actually the only stage that does not require use of the platform CLI at all.  
Mobile developers do not actually have to install any JavaScript tools, nor the platfom itself.  
Indeed, all they will interact with is the `Container` library itself, which is shipped as an `AAR` for Android, and an `Umbrella Framework` for iOS. 

The `Container` contains everything that is needed to actually launch and interact with the different `MiniApps` part of it. In addition to the `MiniApps` themselves (stored in a composite single JS bundle), the container contains all the native dependencies needed by the `MiniApps` (including `react-native` itself of course), as well as the assets of the `MiniApps` (images and fonts mostly) and initialization code to call from your mobile application to initialize the `Container` and get access to the `MiniApps` within.

The most demanding part of this stage has actually to be done only once. This is when you'll first add a dependency to your `Container` library in your mobile application and add the required code to properly initialize the container. 

Once this step is done, you'll be mostly left with bumping the `Container` version every time it gets regenerated (i.e any time a new `MiniApp` makes its way in it, or gets removed or updated). And also of course, taking care of the native code to actually launch the `MiniApps` when needed in your mobile application flow, as well as potentially implementing `APIs` in the mobile application itself (this is not the recommended way for implementing native APIs, but might be neceserray in some use cases).

### Bonus Stage. `APIs` generation and implementation [JavaScript React Native developpers / Mobile application developers]

This stage is actually kind of similar to the first one (creating MiniApps) but it can be performed either by JavaScript React Native developers or Mobile application developers dependending mostly on if the implementation of the API is done on the native side or the JavaScript side.  

`APIs` facililates interaction/communication between your `MiniApp(s)` and your `Mobile Application`. From the point of view of a `MiniApp`, a natively implemented `API` can be consummed to access data or functionality exposed from the native side or trigger actions on the native side. From the point of view of a `Mobile Application` (or another `MiniApp`), a JavaScript implemented `API` can be consumed to access data or functionality exposed from the JavasScript side, or trigger actions on the `JavaScript` side.

This stage involves the following workflow items :

- Creating (generating) a new `API`  
This can be achieved through `ern create-api` command   
It will generate the complete JS/Android/iOS client surface code of the API, along with optional models.
All you are left with is publishing the `API` version on npm. `API` code itself should not be modified. The implementation of the `API` is kept separate, and is the code you actually will need to do on your own. We keep implementation separate from the `API` itself to allow for multiple different implementations of it, that can be easily switched dependending of your context (maybe mock vs prod).

- Updating (re-generating) an existing `API`  
This can be achieved through `ern regen-api` command  
It should be done it you are adding new requests/events or models to your existing `API`. All you have to do is update the `Swagger` schema accordingly and invoke the command. You can then publish this new version of the `API` to npm.

- Implementing an `API`  
An API without an actual implementation is like a bird without wings.  
Because `API` generation and implementation are decoupled, the person in charge of the `API` generation might not be the one actually doing its implementation (even though this should be mostly the case). 
You can kickstart an `API` implementation project through `ern create-api-impl` command. 
Once done, all you are left with is actually coding to implement the `API` functionality, either as a native implementation (which can then be consumed by any `MiniApp` dependening on this `API`) or as a JavaScript implementation (which can then be consumed by any `MiniApp` or `Mobile Application` dependening on this `API`). Implementations can be standalone (i.e not bound to a specific mobile application or MiniApp), which is the recommanded approach, or can be directly done in the mobile application or MiniApp itself.
