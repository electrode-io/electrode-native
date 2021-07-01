## Communication between your MiniApp and native modules

MiniApps _(written in JavaScript)_ are running inside a JavaScript virtual machine. They don't have direct access to the mobile application data and can't directly invoke methods in the mobile application.\
Likewise, the mobile application doesn't have direct access to the MiniApp(s) code.

React Native offers constructs to communicate between the JavaScript side and the native side using its internal bridge, mostly through native modules.

Electrode Native allows the reuse of existing React Native native modules but also comes with its own bridge, which is just an additional library sitting on top of the existing React Native bridge, to expose simpler constructs and handle type safety.

The [Electrode Native Bridge] offers bi-directional communication constructs exposed as events and requests/response messages. Although the [Electrode Native Bridge] can be used directly in your mobile application or MiniApp to ease communication between the two sides, it is still a low level library. You will primarily use APIs, that are using the bridge under the hood, instead of interacting directly with it.

### Electrode Native APIs

You can create and distribute your own Electrode Native APIs or re-use existing APIs.

While Electrode Native APIs are similar in some way to React Native native modules _(which you can also create -or reuse-)_ we don't recommend that you create new native modules if you plan on using Electrode Native. As a best practice, we recommend that you create APIs due to the advantages of using APIs over native modules in the Electrode Native ecosystem.

#### Advantages of using APIs

- APIs are fully generated\
  Just define the interactions your API should offer (as events and requests) in a Swagger schema, and the API code will be generated for JavaScript, iOS, and Android.

- APIs support the generation of model classes\
  Just define the models in your Swagger schema and the necessary classes will be generated. Relying on the [Electrode Native bridge] support means that on the mobile application side, developers will be able to work with typed model classes and leverage compile time checks when dealing with Electrode Native APIs.

- APIs decouple the client code of the API from its implementation\
  You can implement the API on the native side or the JavaScript side. Because of this decoupling, it is also possible to write multiple implementations for a single API.

- APIs are not native modules, they are clients of the [Electrode Native bridge] which is the native module. There is no react native linking needed for APIs.

- APIs are generated and therefore will follow a similar file system structure. This means that APIs don't need any customized configuration to be written for Electrode Native to properly add them to a container.

- APIs are expected to follow a certain versioning convention, which offers more flexibility in terms of compatibility checks between different versions.

[electrode native bridge]: https://github.com/electrode-io/react-native-electrode-bridge
