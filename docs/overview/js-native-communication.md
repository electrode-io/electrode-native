## Communication between your  MiniApp and native modules

Because your MiniApps (written in JavaScript) are running inside a JavaScript virtual machine--they don't have direct access to your mobile application data and can't invoke methods in the mobile application. And your mobile application doesn't have direct access to your MiniApp code.

React Native offers constructs to communicate between the JavaScript side and the native side using its internal bridge-- mostly through native modules.

Electrode Native allows you to reuse existing React Native native modules and also comes with its own bridge.

The Electrode Native bridge offers bi-directional communication constructs exposed as events and requests/response messages. Although the Electrode Native bridge can be used directly in your mobile application or MiniApp to ease communication between the two sides, it is still a low level library. You will primarily use APIs, that are using the bridge under the hood, instead of interacting directly with it.

### Electrode Native APIs
You can create and distribute your own Electrode Native APIs or re-use existing APIs.

While Electrode Native APIs are similar to React Native native modules (which you can also create -or reuse-) we don't recommend that you create new native modules if you plan on using Electrode Native. As a best practice, we recommend that you create APIs because of the advantages of using APIs over native modules in the Electrode Native workflow.

#### Advantages of using APIs
* APIs are fully generated  
Just define the interactions your API should offer (as events and requests) in a Swagger schema, and the API code will be generated for JavaScript, iOS, and Android.

* APIs also support the generation of model classes  
Just define your models in your Swagger schema and the necessary classes will be generated. Relying on the Electrode Native bridge support means that on the mobile application side, developers are able to work with typed model classes and will be able to leverage compile time checks when dealing with APIs.

* APIs decouple the client code of the API from its implementation  
You can implement the API on the native side or the JavaScript side. Because of this decoupling, it is also possible to write multiple implementations for a single API.

* APIs are not native modules, they are clients of the Electrode Native bridge which is the native module. There is no react native linking required for APIs.

* APIs are generated and therefore will follow the exact same file system structure. This means that APIs don't need any customized configuration to be written for Electrode Native to properly add them to a container.

* APIs are expected to follow a certain versioning convention, which offers more flexibility in terms of compatibility checks between different versions.
