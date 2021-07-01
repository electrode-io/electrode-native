## The Electrode Native Workflow

There are three main stages in the Electrode Native workflow:

- Stage 1: Create MiniApps
- Stage 2: Add or Update MiniApps
- Stage 3: Integrate MiniApps in a mobile application

Each stage requires different developer roles and expertise. Depending on the size of your organization or how your teams are structured, some developers may play a key role in one or more stages.

Please note that the worfklows described below are for illustration purposes only, and can serve as a basis to create your own workflow.

### Stage 1: Create MiniApps

**Actor(s)** JavaScript React Native Developer(s)

Everything starts with one or more MiniApps.

MiniApps are typically developed by JavaScript developers--having some experience _(or looking towards gaining experience)_ on front-end applications written in JavaScript--using React or React Native.

Experienced React Native developers won't notice much difference compared to their familiar React Native application development workflow. The Electrode Native workflow is very similar to the React Native workflow and most of the Electrode Native CLI commands are the equivalent to React Native commands.

**Workflow for MiniApps development**

- Create a new MiniApp project using the Electrode Native `ern create-miniapp` command.\
This command is equivalent to the React Native `react-native init` command.

- Add JavaScript and/or native dependencies (platform APIs or supported third party native modules) to the MiniApp using the Electrode Native `ern add` command.\
This command is equivalent to the `yarn add` or `npm install` commands.

- Launch the MiniApp inside the Electrode Native platform runner mobile application.\
The runner allows you to develop, debug, and test the MiniApp standalone, using the `ern run-android` and/or the `ern run-ios` commands. These commands are the equivalent of the `react-native run-android` and `react-native run-ios` commands. Ideally you should also test your MiniApp in isolation, using this runner project.

- Propagate your MiniApp releases to the mobile client application(s). You can either publish your MiniApp releases to npm or just let Electrode Native pick the changes from git branches or tags.

- Optionally, debug and test your MiniApp within the target mobile applications and not on its own in the platform runner. Since your MiniApp may co-exist with other MiniApps in the same mobile application, you will use the Electrode Native `ern link` and/or `ern unlink` and the `ern start` commands to help you in this use case.

### Stage 2: Add or Update MiniApps

**Actor(s)** Release Manager(s) / Mobile Application Lead(s) / DevOps

At Stage 2, you choose the MiniApps (and their versions) that you want to add to your mobile application.

Depending on your organizational structure and development operations, Stage 2 might be handled by a dedicated Release Manager or Mobile Application Lead. In some cases, Stage 2 could also be handled by MiniApps Developers.

This stage also includes shipping updated versions of MiniApps using Over The Air (OTA) updates through CodePush.

Most of the dependency versioning control of the platform takes place in Stage 2. This is also when the cauldron, manifest, and container generator also work hand in hand.

Stage 2 involves interacting with the Electrode Native cauldron commands.

**Workflow for adding or updating MiniApps to/in a mobile application version**

- Create new mobile application versions in the cauldron using the Electrode Native `ern cauldron add nativeapp` command.\
This command needs to be potentially issued for each new mobile application version.

- Add, Remove, and Update MiniApps for a target in-development mobile application version (shipped in a container) using the `ern cauldron [add/del/update] miniapps` commands.

- Add, Remove, and Update native dependencies for target in-development mobile application version using the `ern cauldron [add/del/update] dependencies` commands (shipped in a container)

**Note** Native dependencies that MiniApps directly depends on are automatically added to the container when adding or updating a MiniApp version to a given mobile application version. This workflow item is therefore limited only to native dependencies that no MiniApps are actually depending upon--usually to add standalone native API implementations.

- Update the release status of mobile application versions using the `ern cauldron update nativeapp` command.

Flagging a mobile application version as being released, actually 'freezes' the mobile application version--to disallow any new changes to the native dependencies; you cannot update native code OTA. It will activate a CodePush for this mobile application version, allowing you to effectively push JavaScript changes of MiniApps as OTA updates.

- Add or update MiniApps versions using OTA CodePush updates using the `ern code-push` command.

### Stage 3. Integrate MiniApps in a mobile application

**Actor(s)** Mobile Application Developer(s)

Stage 3 does not require the use of the Electrode Native platform CLI commands.\
Mobile developers working at this stage do not need to install any JavaScript tools or even Electrode Native itself.

At Stage 3, Mobile Application Developers interact with the Container library only--which is shipped as an AAR file for Android, and as an umbrella Framework for iOS.

The container includes everything that is needed to launch and interact with the MiniApps. In addition to the MiniApps (stored in a composite single JavaScript bundle), the container also includes all the native dependencies needed by the MiniApps--including React Native.

Also included in the container are the MiniApps assets _(images and fonts mostly)_ and the initialization code-- to call from your mobile application to initialize the container and get access to the MiniApps stored within.

**Stage 3: Workflow for integrating MiniApps in a mobile application**

- Add a dependency to your container library in your mobile application.
- Add the required code to properly initialize the container.
- Bump the container version every time it gets regenerated--that is any time a new MiniApp (or native dependency) is added, removed, or updated.
- Launch the MiniApps when needed in your mobile application UX flow.
- Implement APIs in the mobile application itself if necessary--this is not the recommended way for implementing native APIs, but might be necessary in some use cases.

### Bonus Stage: Generate and implement APIs

**Actor(s)** JavaScript React Native Developer(s) and Mobile Application Developer(s)

This stage is very similar to Stage 1: Create MiniApps, but it can be performed by either JavaScript React Native Developers or Mobile Application Developers--depending on whether the implementation of the API is done on the JavaScript side or the native side. This stage may be performed by JavaScript React Native Developers--on the JavaScript side, or Mobile Application Developers--on the native side.

APIs facilitate secure interaction and communication between your MiniApps and your mobile application:

- For MiniApps, a native API can be consumed to access data or functionality from the native side or it can be used to trigger actions on the native side.

- For a Mobile Application or another MiniApp, a JavaScript API can be consumed to access data or functionality from the JavaScript side, or it can be used to trigger actions on the JavaScript side.

**Workflow for generating and implementing APIs**

- Create a new API using the `ern create-api` command.
  The complete JavaScript, Android, and iOS client API code is generated along with optional models. All you need to do is then to published the generated API version on npm. The API code should not be modified. The implementation of the API is kept separate as is the code you actually will need to do on your own. We keep implementation separate from the API itself to ease regeneration and to allow for multiple implementations--that can be easily switched depending on your context, for example, development vs production.

- Update an existing API using the `ern regen-api` command.
  This should be done if you are adding new requests, events, or models to your existing API. Simply update the Swagger schema accordingly and invoke the command. You can then publish this new version of the API to npm.

- Implement an API.
  Because API generation and implementation are decoupled, the developer generating the API might not be the developer actually implementing it.
  You can kickstart an API implementation project using the `ern create-api-impl` command.
  Then, add the code implementing the API functionality--either as a native implementation (which can then be consumed by any MiniApp depending on this API) or as a JavaScript implementation (which can be consumed by any MiniApp or Mobile Application depending on this API). Implementations can be standalone (not bound to a specific mobile application or MiniApp), which is the recommended approach. Implementations can also be directly done in the mobile application or MiniApp.
