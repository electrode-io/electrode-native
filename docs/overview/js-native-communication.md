## JavaScript <-> Native communication

Because the code of your `MiniApps` written in `JavaScript` will be executing inside a `JavaScript` virtual machine in the mobile application, they don't have direct access to your mobile application data, nor can they invoke any methods in the mobile application. The same is true the other way arround.

`React Native` offers communication between the JavaScript side and the Native side through its internal bridge, mostly surfaced to the developpers trhough `Native Modules`.

`Electrode React Native`, in addition to allow you to reuse existing React Native `Native Modules`, comes with its own bridge (which is actually nothing more than a `Native Module`), built on top of exiting communication constructs offered by `React Native` out of the box.

`Electrode React Native` bridge offers bi-directional type safe communication, exposed as `events` and `requests/responses` constructs, and can be used directly in your `mobile application` or `MiniApp` to help communication between the two sides; however, using `Electrode React Native`, you will mostly not interact directly with the bridge, but rather with what we call `APIs`.

`Electrode React Native` `APIs` are in some sense equivalent to React Native `Native Modules`.  
 As for `Native Modules`, you can create your own `APIs` and distribute them, or re-use existing ones.  

While you can create new `Native Modules` and use them with `Electrode React Native`, this is not the recommended approach. Indeed, you'll want to create `APIs` instead as they are well integrated with the platform and offer a few advantages compared to native modules when it comes to working with the platform :

- `APIs` are fully generated. Just define the interactions it will offers, as a `Swagger` schema, in terms of `events` and `requests` and the necessary `API` client code, and implementation support code, will be generated for JavaScript/iOS and Android.

- `APIs` also support the generation of model classes. Just define your models in your `Swagger` schema and the necessary classes will be generated. Relying on `Electrode React Native` bridge support, this means that on the mobile application side, developers will be able to work with real models, and will be able to properly leverage their compilation time checks when dealing with `APIs`.

- `APIs` decouple the client code of the `API` from its implementation. You are free to implement the `API` on the `native` side or the `JavaScript` side. Because of this decoupling, it is also possible to write multiple implementations for a single `API`.

- `APIs` are not `Native Modules`. They are clients of the `Electrode React Native` bridge which is the `Native Module`. In that sense, there is no "linking" required for `APIs`.

- `APIs` are generated and therefore will all follow the exact same file system structure. This means that they don't need any specific configuration to be written for `Electrode React Native` to properly add them to a container.

- `APIs` are expected to follow a certain versioning convention, offering more flexibility it terms of compatibility checks between different versions.