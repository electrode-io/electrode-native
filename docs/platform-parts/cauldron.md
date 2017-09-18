## Electrode React Native Cauldron

As soon as you'll want to start adding `MiniApps` to your mobile application, then you'll need a `Cauldron`.

A `Cauldron` is a centralized `database` that can be accessed by any user of the `Electrode React Native CLI`, given they are granted access to this `Cauldron`. 

There is one `Cauldron` per mobile application. A `Cauldron` contains configuration to be used by some of the `CLI` commands, for this specific mobile application (keeping this configuration local to each `CLI` user workstation would be a pain to synchronize otherwise). 

It also contains one record for each of your `mobile application version`. For example `walmart ios 17.15` and `walmart android 17.10.0`. Inside this record, the `Cauldron` stores data pertaining to this specific mobile application version, including all the `MiniApps` (and their versions) that are currently part of this version, as well as the list of all `native dependencies` (and their versions) that are used either directly or transitively by the `MiniApps` (also `native dependencies` that are not depended upon by any `MiniApp` such as native `API implementations`). It also keeps tracks of all the `MiniApps versions` that have been pushed as over the air updates for a given mobile application version. 

All of this data is stored within a single `JSON document` : `cauldron.json`.

In addition to storing data about what your mobile application versions contains, which helps for tracking and history, the `Cauldron` can also be seen as the `gatekeeper` of your mobile application. Indeed, the only way for a `MiniApp` to make its way into any of your mobile application version is trough being added to the `Cauldron` first, for this mobile application version.

The `Cauldron` will perform a lot of compatibility checks to ensure that the `MiniApp` version to be added to the target mobile application version, contains only native dependencies that are supported and that their versions are properly aligned with the one inside the mobile application version. If compatibility checks are passing, a new `Container` version will be generated and published, to contain the changes, and the mobile application version data in the `Cauldron` will be updated accordingly to reflect the current new state of the `Container` (this is in the case the mobile application version is not released yet. Otherwise a `Container` can not be created. In that case, some compatibility checks will be performed and the `MiniApp` will be `CodePushed` instead).

The `Cauldron` can also store files. As of now, the only files that are getting stored, are `yarn.lock` files, used internally to guarantee consistency of non updated `MiniApps` versions. Other file types might be stored in the `Cauldron` soon (for example, `sourcemaps` or `mobile app binaries`).

`Electode React Native CLI` is not tightly coupled to a given `Cauldron`. If you are a `MiniApp` developper working for different mobile application teams, you might want to access multiple `Cauldrons`. The `CLI` allows to link multiple `Cauldron` and switch between them based on your context. There can however be only one `Cauldron` activated at any given time.

### A look inside the Cauldron

The `Cauldron` at its core (well, its root, to be accurate), contains a JSON document : `cauldron.json`. 

This document is the single document of a `Cauldron` database. It contains all of the data regarding all of your mobile applications versions. What `native dependencies` they contains, what `MiniApps` they contains ... it also contains configuration data, specific to this `Cauldron` that will get used by some `CLI commands` run by a user of this `Cauldron`.

This document wil get updated mostly through the execution of associated `ern cauldron` commands.

Let's take a closer look into a sample `cauldron.json` :

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
```

Here are some things we can say by looking at this `cauldron.json` :  
This `Cauldron` contains some global configuration, as well as a single `mobile application` (MyWeatherApp)version (1.0.0) targeting `Android` platform. 
This mobile application version contains two `MiniApps` (seems like to be two screens of the application). This mobile application version has been released, and one `CodePush` update has been done to it, to update the version of one of the two `MiniApps`.

Let's breakdown the different objects stored in the `Cauldron`, level by level, and take a closer look to what they contains.

At the top level of a `cauldron.json` document, you'll find a `config` object (optioal) and a `nativeApps` array.

The top level `config` of the `Cauldron` can only holds a `manifest` config as of now. If you want more details about the `manifest` and its configuration, take a look at our [Manifest guide](url).

The `nativeapps` array holds the data of all the different `mobile applications` part of the `Cauldron`. A `Cauldron` can store multiple mobile applications, however we do not recommened this approach for most common workflows, using one `Cauldron` per `mobile application` should be favored.
For each `mobile application`, the second level is the `platforms` array. `Electrode React Native` supports two platforms as of now : `android` and `ios`. Finally for each platform, their can be multiple `versions` of the `mobile application`. This is at this level (`mobile application` + `platform` + `version`) that most of the `Cauldron` data resides.

At the `platforms` level we can see that for the `android` platform of the `MyWeatherApp` application, there is a `config` object. This configuration object contains configuration that will apply to every versions of `MyWeatherApp` for `android`. Specifically it can hold some configuration pertaining to `CodePush` (see our [CodePush guide](url) for more details) as well as some configuration for the `Container` generator (see our [Container guide](url) for more inforation).

For each unique version of a mobile application, here is what the `Cauldron` stores :

- `ernPlatformVersion` : The version of `Electrode React Native` used.
- `isReleased` : `true` if this version is released (to users), `false` othewise (in dev)
- `yarnlock` : The SHA of the `yarn.lock` file stored in the `Cauldron` filestore, that should be used for generating the `composite JavaSript bundle`.
- `nativeDeps` : An array of native dependencies descriptors, corresponding to the native dependencies stored in the current `Container` of this version
- `miniApps` : An of `MiniApps` package descriptors, corresponding to the `MiniApps` currently part of the `Container` of this version, or released through `CodePush` updates.

### Setting up a Cauldron

The good part is that setting up a `Cauldron` is really not that hard. Indeed, from a high level standpoint, a `Cauldron` is just some data stored in a `git repository`. If you know how to create a `git repository` then you know how to create a `Cauldron`.

You are free to use any provider offering `git` repository storage, when it comes to hosting of your `Cauldron`. `GitHub` and `BitBucket` are probably two of the most popular. We'll mention `GitHub` in the rest of this documentation, but you are free to use your own provider.

All you'll need to do to create your own mobile application `Cauldron`, is simply to create a new `GitHub repository` to host your `Cauldron`. You can name the repository as you'd wish, even though we would recommend to name it as `[mobile_app_name]-cauldron`. Indeed, a `Cauldron` is bound to one `mobile application` (even though it can hold multiple mobile applications, this is not something we would recommend).

Once you have your `Cauldron` repository created, all you are left with is to tell your `ern CLI` that you want to use this specific `Cauldron`. This can be easily done using `ern cauldron repo add` command. 

That's it, your `Cauldron` is ready to roll ! The next step will then be to add your first mobile application version in the `Cauldron`, using `ern cauldron add nativeapp` command.

### Cauldron compatibility checks

Any MiniApp or native dependency that needs to be added to a mobile application version stored in the Cauldron, will go through a suite of versions compatibility checks. If any of these checks is failing, the MiniApp or dependency won't be added to the Cauldron. (as a side note, this is also why one should not modify the Cauldron repository manually, as it effectively results in bypassing compatibility checks). 

The Cauldron perform these checks to make sure that any MiniApp, or native dependency version added to a mobile application version, will not lead to runtime issues, and play nicely with the other MiniApps and dependencies already part of the Container of the mobile application.

In reality, the checks are mostly looking at native dependencies versions proper alignment (react-native itself and any native module or API / API implementation that the MiniApp is using).

Here are some of the compatibility checks, and logic, performed by Electrode React Native, when running an operation changing the state of a Container (what it will contain will change, following the operation), or the state of the composite JS bundle (in the case of an OTA update through CodePush)

- Adding a new MiniApp
    - To a in development mobile application version  
For each of the native dependencies included in the MiniApp :
        - Nothing to do if the native dependency is already in the Container, using the same version.
        - If the native dependency is not already in the Container, add it.
        - If the native dependency is already in the Container, but with a different version, ensure that the versions are backward compatible (for third party native modules we don't consider backward compatibility, the platform will require exact version match, whereas APIs follow more flexible rules). If that is the case and the version of the dependency used by the MiniApp is greater than the one in the Container, just bump the version of the dependency in the Container, to the one used by the MiniApp. If that is not the case, fail.

    - To a released mobile application version
For each of the native dependencies included in the MiniApp :
       - Nothing to do if the native dependency is already in the Container, using the same version.
       - If the native dependency is not already in the Container, fail. It is not possible to add native dependency through OTA updates (for third party native modules we don't consider backward compatibility, the platform will require exact version match, whereas APIs follow more flexible rules). If that is the case and the version of the dependency used by the MiniApp is lower than the one in the Container, proceed. Otherwise, fail.

- Removing a MiniApp  
The checks are relatively straightforward here. Indeed, Electrode React Native currently does not try to remove any of the native dependencies used by the MiniApp. Therefore, removing a MiniApp is not going through any compatibility checks right now.

- Updating a MiniApp version  
The checks will be exactly the same as the ones done when Adding a new MiniApp.

When it comes to directly adding/updating or removing native dependencies in a mobile application version, the following wll apply only for in development mobile application versions, as it's not possible to add/remove or update a native dependency version through an OTA update.

- Adding a new native dependency

No checks performed here. If this is a new native dependency, just add it as it won't conflict with any versions.

- Updating a native dependency version

Ensure of backward compatibility and only allows forward version update.

- Removing a native dependency

Verify that no MiniApp part of the Container is using this native dependency.

### Who should get access to the Cauldron ?

Well, it depends.  

Indeed, depending on the size of your organization/team and your intended workflow with `Electrode React Native`, it could be that only one person (more of a release manager or mobile app lead role) gets write access to the `Cauldron`. In that case `MiniApp` developers will only get `read` access (because `ern` needs some data from the `Cauldron` in the context of some commands). In that case, if there are dedicated `MiniApps` developers for the mobile application, they will just need to publish new versions of their `MiniApps` to npm, and the release manager will take care of managing the `Cauldron`.

The other way would be to give `write` access to the `Cauldron` to `MiniApps` developers as well. This way, as soon as they publish new versions of their `MiniApps` they can by themselves add them to the `Cauldron`.

### A word of caution

The choice of using a `git` repository as the underlying `Cauldron` store is a double edged sword.  
Indeed, while it offers a lot of benefits compared to a full fledge heavy database, the downside is that developers used to deal with `git` repositories, are also used to a certain kind of workflow with `git` repositories, that they shouldn't apply when working with a `Cauldron` repository.

You could be tempted to start `forking`, `branching` and `issuing pull requests` for a Cauldron. Don't. 

A `Cauldron` is meant to be updated only `Electrode React Native CLI` commandss. You should not update the Cauldron `'manually'` (the exception to the rule being for configuration as we don't yet have associated commands). By updating a `Cauldron` manually, you will bypass all compatibility checks performed by `Electrode React Native` and you will also take the risk to descynchronize the container version and the `yarn` locs. To put it in a nutshell : this is a bad idea.

If you think you have no way of updating specific information in the `Cauldron` through `CLI` commands, think again; and if there is really no way of doing what you're trying to accomplish through a `CLI` command, the it means we are probably missing a command (or some options to an existing command). In that case please open an `issue`, explaining what you are trying to achieve, to see if introducing a new comamand or updating one manse sense. 

### Related commands

- `ern cauldron *`  
All of the sub-commands inside the `ern cauldron` command are used to either access or update the state of the `Cauldron` in some way. A lot of other commands are accesing the `Cauldron` for their workflow as well.