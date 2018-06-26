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