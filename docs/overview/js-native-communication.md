## Communication between your  MiniApp and native modules

Because your MiniApps (written in JavaScript) execute inside a JavaScript virtual machine in the mobile application--they don't have direct access to your mobile application data and they can't invoke methods in the mobile application. And your mobile application doesn't have direct access to you MiniApp code.

However, React Native offers communication between the JavaScript side and the native side using its internal bridge--accessed through native modules.

Electrode Native allows you to reuse existing React Native native modules and it comes with its own bridge--Which is actually a native module built on top of existing communication constructs offered by React Native out of the box.

The Electrode Native bridge offers bi-directional communication exposed as events and requests/response constructs. Although this can be used directly in your mobile application or MiniApp to help communication between the two sides, you will primarily use APIs instead of interacting directly with the bridge.

### Electrode Native APIs
You can create and distribute your own Electrode Native APIs or re-use existing APIs.

While Electrode Native APIs are similar to React Native native modules (which you can also create) we don't recommend that you create new native modules. As a best practice, we recommend that you create APIs because of the advantages of using APIs.

#### Advantages of using APIs
* APIs are fully generated--just define the interactions your API will offer as a Swagger schema (in terms of events and requests, the necessary API client code, and implementation support code) and the necessary APIs will be generated for JavaScript, iOS, and Android.

* APIs also support the generation of model classes--just define your models in your Swagger schema and the necessary classes will be generated. Relying on the Electrode Native bridge support means that on the mobile application side, developers are able to work with real models and they will be able to properly leverage their compilation time checks when dealing with APIs.

* APIs decouple the client code of the API from its implementation. You can implement the API on the native side or the JavaScript side. Because of this decoupling, it is also possible to write multiple implementations for a single API.

* APIs are not native modules, they are clients of the Electrode Native bridge which is the native module. There is no linking required for APIs.

* APIs are generated and therefore will follow the exact same file system structure. This means that APIs don't need any customized configuration to be written for Electrode Native to properly add them to a container.

* APIs are expected to follow a certain versioning convention, which offers more flexibility in terms of compatibility checks between different versions.