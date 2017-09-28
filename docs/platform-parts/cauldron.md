## Electrode Native Cauldron

A Cauldron is a centralized document database that is used to store information about mobile application versions, native dependencies, and information about MiniApps. There is one cauldron per mobile application. With appropriate permissions, you can use the Electrode Native CLI commands to access and modify the data stored within the Cauldron. Some Electrode Native CLI commands are relying on the Cauldron for their execution.

The cauldron document contains:
* One record for each mobile application version, for example: `Walmart iOS 17.15` and `Walmart Android 17.10.0`.
* Data pertaining to a specific mobile application version including all MiniApps (and their versions) that are currently part of it
* The list of all native dependencies (and their versions) used by MiniApps (or not) in a specific mobile application version
* The list of all MiniApp versions that have been pushed as Over-the-Air (OTA) updates for any given mobile application version

The cauldron document is actually a single JSON document: `cauldron.json`.

In order to use a MiniApp in any mobile application, first you'll need to add the MiniApp in the cauldron associated to that mobile application. Before adding a MiniApp to a Cauldron, Electrode Native performs compatibility checks to confirm that the MiniApp version (to be added to the target mobile application version) contains only native dependencies that are supported and that the versions are properly aligned with the mobile application version.

If compatibility checks pass, a new container version is generated and published. The new container is updated with the changes and the mobile application version data stored in the Cauldron is updated accordingly to reflect the current new state of the new container version. This occurs when the mobile application version is not released yet (in-development). If some dependencies versions are not compatible, a new container won't be created. Similar checks happen for pushing a MiniApp update as an Over-the-Air (OTA) update.

The cauldron can store `yarn.lock` files that are used internally to guarantee consistency of non-updated MiniApp versions.

Using the Electrode Native CLI, you can access multiple cauldrons. There can however be only one cauldron activated at a time.

### The cauldron configuration file

The following is an example of a `cauldron.json` document.

```json
{
  "config": {
    "manifest": {
      "override": {
         "url": "git@github.com:user/ern-custom-manifest.git",
         "type": "partial"
       }
     }
  },
  "nativeApps": [
    {
      "name": "MyWeatherApp",
      "platforms": [
        {
          "name": "android",
          "config": {
            "containerGenerator": {
              "containerVersion": "1.2.3",
              "publishers": [
                {
                  "name": "github",
                  "url": "git@github.com:user/myweatherapp-android-container.git"
                },
                {
                  "name": "maven",
                  "url": "http://user.nexus.repo.com:8081/nexus/content/repositories"
                }
              ]
            }
          },
          "versions": [
            {
              "name": "1.0.0",
              "ernPlatformVersion": "0.5.0",
              "containerVersion": "1.2.3",
              "isReleased": true,
              "yarnlock": "3ed0a5981a22d89d3b30d6e2011b5b581581771c",
              "nativeDeps": [
                "react-native@0.42.0",
                "react-native-electrode-bridge@1.5.0",
                "react-native-ern-weather-api@0.19.0",
                "react-native-vector-icons@4.0.0",
                "react-native-code-push@1.17.1-beta"
              ],
              "miniApps": {
                "container": [
                  "react-native-weather-overview@1.0.0",
                  "react-native-weather-details@2.1.3",
                ],
                "codePush": [
                 [
                   "react-native-weather-overview@1.0.0",
                   "react-native-weather-details@2.0.0",
                 ]
                ]
              }
            }
          ]
        }
      ]
    }
  ]
}
```

This example `cauldron.json` document shows the following:  
* This cauldron contains global configurations as well as a single Android mobile application version: `MyWeatherApp 1.0.0`.  
* This mobile application version contains two MiniApps (these might be two screens of the application).  
* This mobile application version has been released and one CodePush update has been performed to update the version of one of the two MiniApps.  

The configuration also shows the different objects stored in the cauldron--level by level.

* A config object (optional) and a nativeApps array  
* Currently the cauldron top level configuration object can only hold a manifest configuration. For details about the manifest and its configuration, see the information about the  [Electrode Native Manifest](./manifest.md).  

* The `nativeapps` array contains the data of all mobile applications that are part of the cauldron. A cauldron can store multiple mobile applications, however it is not recommended--instead, we recommend that you use one cauldron per mobile application.  

* For each mobile application, the second level is the platforms array. Electrode Native supports two platforms: Android and iOS. For each platform, there can be multiple versions of a mobile application. Most of the Cauldron data is stored at this level (mobile application + platform + version).

* At the platform level of the `MyWeatherApp` application (Android), an optional config object contains configuration for the Container generator that applies to every version of the `MyWeatherApp` for the Android platform. It also contains CodePush configuration. For information about CodePush, see the [CodePush documentation](https://microsoft.github.io/code-push/) for more details. For information about the container generator configuration, see the [Container documentation](./container.md).

For each version of a mobile application, the cauldron stores the following:

- `isReleased` : `true` if this version is released to users and `false` otherwise (this version is in development)
- `yarnlock` : The SHA of the `yarn.lock` file stored in the cauldron file store - this is used by Electrode Native when generating the composite JavaScript bundle.
- `nativeDeps` : An array of native dependencies descriptors, corresponding to the native dependencies (and their versions) stored in the current container of this mobile application version
- `miniApps` : MiniApps package descriptors corresponding to the MiniApps currently part of the current Container version or released through CodePush updates

### Setting up a cauldron

Setting up a cauldron is basically the same process as creating a Git repository and storing the data in the repository. If you know how to create a git repository, then you know how to create a Cauldron. To host your cauldron, you can use any provider offering Git repository storage. GitHub and BitBucket are probably two of the most popular providers. Within our documentation, we mention GitHub but you are free to use the provider of your choice.

To create your own mobile application cauldron:

1) Create a new GitHub repository to host your cauldron.  
While there are no repository naming conventions, we recommend that you name it: `[mobile_app_name]-cauldron`

Note: A cauldron is bound to one mobile application--even though it can hold multiple mobile applications. We do not recommend holding multiple mobile applications within a cauldron.

2) Add the cauldron to the repository using the Electrode Native CLI.  

```bash
$ ern cauldron repo add <cauldron-alias> <cauldron-url>
```

3) Add your first mobile application version in the cauldron.

```bash
$ ern cauldron add <native-app-descriptor>
```

### Cauldron compatibility checks

Any MiniApp or native dependency that needs to be added to a mobile application version stored in the cauldron will go through a series of version compatibility checks. If any of these checks fails, the MiniApp or dependency won't be added to the cauldron (and ultimately won't be included in a new Container or shipped as an OTA update). This is one of the reason not to modify the cauldron repository manually as it results in bypassing compatibility checks.

The Cauldron performs compatibility checks to make sure that any MiniApp or native dependency version added to a mobile application version, will not lead to runtime issues with other MiniApps and dependencies already part of the container of the mobile application.

The compatibility checks are primarily checking the native dependency versions proper alignment--React Native and any native module or API / API implementation that the MiniApp uses.

Listed below are some of the compatibility checks and logic that is performed by Electrode Native, when running an operation changing the state of a container--what it will contain will change, following the operation, or the state of the composite JavaScript bundle will change--in the case of an OTA update using CodePush.

- Adding a new MiniApp
    - To a in-development mobile application version  
For each of the native dependencies included in the MiniApp:
        - Nothing to do if the native dependency is already in the Container, using the same version.
        - If the native dependency is not already in the Container, add it.
        - If the native dependency is already in the Container but with a different version, ensure that the versions are backward compatible (for third-party native modules we don't consider backward compatibility--the platform requires an exact version match, however APIs follow more flexible rules). If that is the case and the version of the dependency used by the MiniApp is greater than the one in the Container, bump the version of the dependency in the container to the one used by the MiniApp. If that is not the case, the process fails.

    - To a released mobile application version
For each of the native dependencies included in the MiniApp:
       - Nothing to do if the native dependency is already in the Container, using the same version.
       - If the native dependency is not already in the Container, fail. It is not possible to add a native dependency using OTA updates (for third-party native modules we don't consider backward compatibility, the platform requires an exact version match, whereas APIs follow more flexible rules). If that is the case and the version of the dependency used by the MiniApp is lower than the one in the Container, proceed. Otherwise, fail.

- Removing a MiniApp  
Compatibility checks are not performed and Electrode Native does not try to remove any of the native dependencies used by the MiniApp.

- Updating a MiniApp version  
Compatibility checks are the same as the checks performed when adding a new MiniApp. See information in the Adding a new MiniApp bullet item above.

When directly adding, updating, or removing native dependencies in a mobile application version, the following applies only for in-development mobile application versions. It is not possible to add, remove, or update a native dependency version using an OTA update.

- Adding a new native dependency
Compatibility checks are not performed. If this is a new native dependency, add it as it won't conflict with existing versions.

- Updating a native dependency version  
Ensure of backward compatibility--only forward version updates are allowed.

- Removing a native dependency  
Verify that there are no MiniApps in the the Container using the native dependency that you want to remove.

### Granting access to the cauldron

Depending on the size of your organization and team, and your intended Electrode Native workflow, it's possible that only one person should be granted Write access to the Cauldron. This person is usually a Release Manager or Mobile App Lead. In this scenario, MiniApp developers are granted Read access--because Electrode Native needs some data from the cauldron. If there are dedicated MiniApps developers for the mobile application, they will need to publish new versions of their MiniApps to npm, and the Release Manager manages the Cauldron.

Alternatively, you can give Write access to the cauldron--to MiniApp developers as well. In this scenario, as soon as the MiniApp developers publish new versions of their MiniApps, they can add them directly to the Cauldron.

Because a Cauldron is a GitHub repository, access can be controlled directly through GitHub.

### Guidelines and limitations

While Git offers many benefits in our case compared to a large database system, developers who are familiar with Git repositories are also familiar with the Git workflow--which doesn't match the workflow when working with a cauldron repository. For example, developers working in a Git repository might be tempted to fork, branch, and issue pull requests for a cauldron.

A Cauldron should only be updated using the Electrode Native CLI commands. You should not update the Cauldron 'manually'. If you update a cauldron manually, you bypass all compatibility checks performed by Electrode Native and you risk de-synchronizing the container version and the yarn locks. Only exception to this rule is if you need to setup some `config` objects in the Cauldron (container generator, manifest), as Electrode Native doest have any CLI command yet to write configuration to the Cauldron.

Note: Open an issue if you aren't able to achieve what you need in the Cauldron through using only Electrode Native CLI commands. It's possible that an existing command should be updated or a new command should be created.

### Related commands

- `ern cauldron *`  
All sub-commands inside the `ern cauldron` command are used to access or update the state of the cauldron.
