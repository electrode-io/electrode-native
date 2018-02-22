## Working with Electrode Native APIs

At some point you'll need one or more MiniApps to interact with your mobile application--to access data or to trigger an action. Or, your mobile application may need to interact with your MiniApps. That's where Electrode Native APIs come into play.

Powered by the Electrode Native bridge and automatically generated for you by Electrode Native from a Swagger schema, Electrode Native APIs provide clearly defined methods of communication between the native Android or iOS side and the JavaScript side.

There are two components to Electrode Native APIs: the API project itself and the API implementation.

### The API project

Electrode Native automatically generates APIs based on a Swagger schema. The generated API results in a cross platform API project that includes the client code of the API, for all three platforms (JS/Android/iOS), along with the optional API models. Any Electrode Native MiniApp or mobile application can then use this Electrode Native API.

The generated API also contains the necessary hooks to implement the API. For example if your movie API defines a `getAllMovies` request, the API project will also contain hooks to write the actual request handling code and return the appropriate response --in this example, the collection of all movies.

The implementation of an API is not part of the API itself. The API project and the API implementation remain separate. One of the reason is to allow multiple implementations for any given API and offer the possibility to switch between implementations.

Once the API is generated, you should not modify it in any way. The API module contains only generated code. Any regeneration of it (for example, following a schema update) will actually overwrite any custom made user code modifications.

Generated APIs have the following naming convention: `react-native-[name]-api`

### API implementation

API implementations aren't completely generated for you--for obvious reasons, Electrode Native can't know what your implementation will actually do. However, Electrode Native still generates some of the code to help you kickstart Electrode Native API implementations projects.

An API implementation implements the handling of requests and events from the API. For example, it implements the actual logic behind the `getAllMovies` request. An API implementation is done on one "side" only. For example, an implementation of a given API can be a native implementation (iOS and/or Android) or a JavaScript implementation--but not both. At least not in the same API implementation module.  

There can be multiple implementations for a given API. For example, it is possible to have a JavaScript implementation and a native implementation of the same API. But for any API, only one implementation can be used at runtime.

### Versioning APIs

Electrode Native APIs have a few advantages compared to React Native native modules. Because Electrode Native APIs are generated, and Electrode Native knows their exact structure, they don't require a specific container injection (linking) configuration (in the Manifest).

For native modules versions, the platform will not allow a version mismatch. If two different versions (including patch versions) of an identical native module are used by two different MiniApps, the Electrode Native platform won't allow adding both MiniApps. Native module versions must be an exact match--including the patch version, as we can't be sure of the versioning guidelines they follow.

However, for APIs (and API implementations), Electrode Native is less strict with version checks, because of the guidelines listed below, that you should adopt for versioning your APIs.

- **Patch version bump**  
Used when your API contains changes to the internal implementation and not to the public implementation. For example, from `1.0.0` to `1.0.1`. Because APIs are fully generated and should not to be modified manually, this should only occur when you regenerate an API following a platform version update that contains internal changes such as bug fixes or improvements to our API generator.

For API implementations, you should patch bump if you are making internal modifications to one or more event(s)/request(s) implementation.  

- **Minor version bump**  
Used when your API contains new requests or new events. For example, from 1.0.0 to 1.1.0.  

- **Major version bump**  
Used when your API contains breaking changes to its public implementation. For example if you remove or rename an existing request or event. For example, going from `1.0.0` to `2.0.0`.

Electrode Native also offers more flexibility for deploying MiniApps that are using API versions not strictly aligned with API versions defined in a container.

- **API with a different patch version**  
Used when trying to deploy a MiniApp that contains an API version that exists in the container with a different patch version--Electrode Native assumes binary compatibility in any case.  

- **API with a different minor version**
Used when trying to deploy a MiniApp that contains an API version that exists in the container with a different minor version--Electrode Native assumes binary compatibility only if the version stored in the container is greater than the one used by the MiniApp.

- **API with a different major version**
Used when trying to deploy a MiniApp that contains an API version that exists in the container with a different major version--Electrode Native considers binary incompatibility and does not allow deployment.

### API guidelines

While the recommended approach to implement Electrode Native APIs is in a dedicated standalone project, which favors reuse and allows for switching implementations, it might not be possible in your context to implement a standalone API. For example if your native API implementation is dependent on your mobile application code itself, you might want to perform the API implementation directly inside your mobile application. This is possible, however we don't recommend this tight coupling approach.

If possible, MiniApps should not directly depend on API implementations; as this makes switching between API implementations for the same API more complex. MiniApps should therefore ideally only depend on APIs. MiniApps can have some API implementations as development dependencies only. For example, if we consider an API with a native implementation of it (iOS and Android), it can be possible to have a cross-platform JavaScript mock implementation of it, that can be used during development to launch the MiniApp standalone.

Generated standalone API implementations have the following naming convention: `react-native-[name]-api-impl`

### Related commands

- [ern create-api]  
Creates (generates) a new API project based on a Swagger schema

- [ern regen-api]  
Regenerates an existing API project following Swagger schema updates

- [ern create-api-impl]  
Creates (generates) a new API implementation project (native or JS)

[ern create-api]: ../cli/create-api.md
[ern regen-api]: ../cli/regen-api.md
[ern create-api-impl]: ../cli/create-api-impl.md
