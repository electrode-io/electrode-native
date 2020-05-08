While the Electrode Native cauldron makes sure that no misaligned-aligned or non-supported native dependency version makes it into your mobile application--the Electrode Native manifest aligns native dependency versions across multiple MiniApps in the first place.

Each Electrode Native platform version is associated to an array of supported native dependencies along with their versions. For example:

```json
[
  "react-native@0.42.0",
  "react-native-code-push@1.17.1-beta",
  "react-native-stack-tracer@0.1.1",
  "react-native-vector-icons@4.0.0",
  "react-native-maps@0.13.1"
]
```

The array contains the list of all third-party native dependencies (everything except APIs and API implementations) supported by a given Electrode Native platform version along with the versions that should be used.

When native dependencies are added to a MiniApp using the `ern add` command (based on the Electrode Native version used), the command verifies if the dependency is supported and if it is supported, the version declared in the Electrode Native manifest is used.

The Electrode Native platform guarantees that any MiniApp targeting a given Electrode Native version will only include supported dependencies, at the same versions--making it possible to add all MiniApps to a single Electrode Native container.

The Electrode Native platform stores its master manifest in a GitHub repository, [electrode-native-manifest](https://github.com/electrode-io/electrode-native-manifest/blob/master/manifest.json).  
By default, Electrode Native uses the master manifest. For more advanced use cases, it is possible to override the master manifest as described later in this documentation.

In order to update the manifest at any time, it is stored in a Git repository. This allows for adding new supported dependencies for an Electrode Native version at any time, without having to wait for the next Electrode Native main version to be released.

For any Electrode Native version defined in the master manifest:

- We can add new native dependencies support.
- We cannot change or remove existing native dependencies versions (except for bridge and APIs as the following a versioning allowing for more flexibility)

If you change version of or remove native dependencies, the version alignment guarantees offered by the manifest will be lost.

The Electrode Native manifest repository contains:

- The Electrode Native manifest file: `manifest.json`
- Configurations for all supported third-party native modules (The configurations are used by the container generator to inject the native dependencies in the container during generation.)

Open source MiniApp developers should always use the master manifest. This is the default operating mode of the platform.

To align your native dependencies to a new Electrode Native version, use the `ern upgrade-miniapp` command. When you align the native dependencies to a new Electrode Native version, your MiniApp will be able to be added to any mobile application using any Electrode Native version.

You might also consider using the same version of React Native for your mobile application, for a while, before upgrading to a new version of React Native. Indeed, upgrading (the version of react-native or associated native modules) too frequently might harm your release process because you cannot use CodePush to release updates to versions of your mobile application that have already been released with a different version of React Native.

For each new Electrode Native version, the master manifest will contain updated versions of most of the native dependencies, including the version of React Native itself. The master manifest will always uses the latest available version of React Native for each new Electrode Native release.
