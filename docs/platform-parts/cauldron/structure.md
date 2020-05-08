The cauldron document contains:
* One record for each mobile application version, for example: `MyWeatherApp iOS 1.1.0` and `MyWeatherApp Android 1.0.0`.
* Data pertaining to a specific mobile application version including all MiniApps (and their versions) that are currently part of it
* The list of all native dependencies (and their versions) used by MiniApps (or not) in a specific mobile application version
* The list of all MiniApp versions that have been pushed as Over-the-Air (OTA) updates for any given mobile application version

The cauldron document is actually a single JSON document: `cauldron.json`.

In order to use a MiniApp in any mobile application, first you'll need to add the MiniApp in the cauldron associated to that mobile application. Before adding a MiniApp to a Cauldron, Electrode Native performs compatibility checks to confirm that the MiniApp version (to be added to the target mobile application version) contains only native dependencies that are supported and that the versions are properly aligned with the mobile application version.

If compatibility checks pass, a new container version is generated and published. The new container is updated with the changes and the mobile application version data stored in the Cauldron is updated accordingly to reflect the current new state of the new container version. This occurs when the mobile application version is not released yet (in-development). If some dependencies versions are not compatible, a new container won't be created. Similar checks happen for pushing a MiniApp update as an Over-the-Air (OTA) update.

The cauldron stores `yarn.lock` files that are used internally to guarantee consistency of non-updated MiniApp versions.

Using the Electrode Native CLI, you can access multiple cauldrons. There can however be only one cauldron activated at a time.

### The cauldron document

The following is an example of a `cauldron.json` document.

```json
{
  "nativeApps": [
    {
      "name": "MyWeatherApp",
      "platforms": [
        {
          "name": "android",
          "versions": [
            {
              "name": "1.0.0",
              "isReleased": true,
              "binary": null,
              "yarnLocks": {
                "container": "3f5f0e4bac859b9e83adacacc2141e594ac1403d"
              },
              "codePush": {
                "Production": [
                  {
                    "metadata": {
                      "deploymentName": "Production",
                      "isMandatory": true,
                      "appVersion": "1.0.0",
                      "size": 1877208,
                      "releaseMethod": "Release",
                      "label": "v16",
                      "releasedBy": "whoever@whatever.com",
                      "rollout": 100
                    },
                    "miniapps": [
                      "movielistminiapp@0.0.11",
                      "https://github.com/electrode-io/moviedetails-miniapp#0.0.9"
                    ],
                    "jsApiImpls": []
                  }
                ]
              },
              "containerVersion": "1.0.9",
              "container": {
                "nativeDeps": [
                  "react-native-code-push@5.2.1",
                  "react-native-ernmovie-api@0.0.9",
                  "react-native-ernnavigation-api@0.0.4",
                  "react-native@0.52.2",
                  "react-native-electrode-bridge@1.5.9"
                ],
                "miniApps": [
                  "movielistminiapp@0.0.10",
                  "https://github.com/electrode-io/moviedetails-miniapp#0.0.9"
                ],
                "jsApiImpls": [],
                "ernPlatformVersion": "0.24.0"
              }
            }
          ]
        }
      ]
    }
  ]
}
```

This sample `cauldron.json` document shows the following:  
* This mobile application version contains two MiniApps (these might be two screens of the application).  
* This mobile application version has been released and one CodePush update has been performed to update the version of one of the two MiniApps.  

* The `nativeapps` array contains the data of all mobile applications that are part of the cauldron. A cauldron can store multiple mobile applications, however it is not recommended--instead, we recommend that you use one cauldron per mobile application. It can also be a good idea to go even more granular and have one Cauldron per native application platform (i.e `MyWeatherApp Android` / `MyWeatherApp iOS`)

* For each mobile application, the second level is the platforms array. Electrode Native supports two platforms: Android and iOS. For each platform, there can be multiple versions of a mobile application. Most of the Cauldron data is stored at this level (mobile application + platform + version).

For each version of a mobile application, the cauldron stores the following data:

- `isReleased` : `true` if this version is released to users and `false` otherwise (this version is in development)
- `yarnlock` : The SHA of the `yarn.lock` file stored in the cauldron file store - this is used by Electrode Native when generating the composite JavaScript bundle.
- `nativeDeps` : An array of native dependencies descriptors, corresponding to the native dependencies (and their versions) stored in the current container of this mobile application version
- `miniApps` : MiniApps package descriptors corresponding to the MiniApps currently part of the current Container version or released through CodePush updates. The `miniApps` array only contains immutable versions. What this means is that any MiniApp path refer to a specific version. For example in the case of a MiniApp added as a registry path, a fixed version must be specified (ex: `movielistminiapp@0.0.10`). This cannot be a range version (ex : `movielistminiapp@^0.0.10`). In the same way, this cannot be a branch (ex : `"https://github.com/electrode-io/moviedetails-miniapp#master`). While it is possible to add a MiniApp this way; Electrode Native will track the branch and only keep a commit SHA in the `miniApps` array (ex : `"https://github.com/electrode-io/MovieDetailsMiniApp#ce08c19e2b707fc96a4db016c47a6f3ae8d66262`). This is done to make sure that one can know exactly what versions (and thus code) of the MiniApps are included in a given Container. Indeed, using a version range such as `^0.0.10` or a branch such as `master` would not allow one to know exactly what is included in a given Container version.

### Cauldron configuration files

Configuration files (`.json` files) are kept in a `config` directory at the root of the Cauldron.
At this time there is no way to set or update configuration through commands. Configuration should be done manually.

* This cauldron contains global configurations as well as a single Android mobile application version: `MyWeatherApp 1.0.0`.  

***default.json***
```json
{
  "manifest": {
    "override": {
        "url": "git@github.com:username/ern-custom-manifest.git",
        "type": "partial"
      }
    },
    "codePush": {
    "entriesLimit": 10
  },
  "requiredErnVersion": ">=0.26.0"
}
```

***MyWeatherApp-android.json***

```json
{
  "containerGenerator": {
    "pipeline": [
       {
        "name": "build-config",
        "extra": {
          "configurations": [
            "ElectrodeContainer-Debug",
            "ElectrodeContainer-Release"
          ],
          "settings": {
            "ENABLE_BITCODE": "NO",
            "DEBUG_INFORMATION_FORMAT": "dwarf-with-dsym"
          }
        }
      },
      {
        "name": "git",
        "url": "git@github.com:username/myweatherapp-android-container.git"
      },
      {
        "name": "maven",
        "url": "http://repository.example.com:8081/nexus/content/repositories"
      }
    ]
  }
}
```

* At the platform level of the `MyWeatherApp` application (Android), an optional config object contains configuration for the Container generator that applies to every version of the `MyWeatherApp` for the Android platform. Likewise it contains some configuration for a Container transformer. It also contains CodePush configuration. For information about CodePush, see the [CodePush documentation](https://microsoft.github.io/code-push/) for more details. For information about  Container Generator and Transformers configuration, refer to the [Container documentation](./container.md).
