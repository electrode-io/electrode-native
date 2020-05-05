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
