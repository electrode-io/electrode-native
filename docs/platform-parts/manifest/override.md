You can override the master manifest partially or fully with your own manifest file:

- To stick to some specific native dependencies versions over time while still allowing for Electrode Native version updates
- To allow for the use of non open-sourced (private) native modules in your MiniApps

To override a manifest:

1. Create your own manifest repository on GitHub (you can fork this [starter manifest](https://github.com/electrode-io/electrode-native-starter-manifest)).
2. Create a manifest override configuration in your cauldron--so that it is correctly applied to all users of this cauldron.
3. Update and maintain your manifest as needed, over time.

The following example shows a configuration that includes a partial manifest override.

```json
"config": {
  "manifest": {
    "override": {
      "url": "git@github.com:username/ern-custom-manifest.git",
      "type": "partial"
    }
  }
}
```

The configuration object should be **manually added to your cauldron** at the same level as the `nativeApps` array.  

* The `override url` is the url of the GitHub repository containing your own Manifest  
* The `override type` value can be either partial or full. For most use cases you'll use the partial; full can be useful in rare cases.

#### Partial override

The array of dependencies and the versions used by a given Electrode Native version will be the combination of both the override manifest and the master manifest. If a dependency is defined in both manifests for a different version, the override version takes precedence, masking the version defined in the master manifest.

For plugins (native modules) configurations using the partial override type, Electrode Native first checks for a matching plugin configuration inside the override manifest and then returns the matching configuration if found. If a matching configuration is not found, it then checks the master manifest.

#### Full override

For dependencies or plugin configurations, a full override means that Electrode Native only queries the override manifest. The master manifest is never used. A full override  completely masks the master manifest.

#### manifest.json document

Starting with Electrode Native 0.32.0, Electrode Native offers an improved `manifest.json` structure that is not used by our [Master Manifest](https://github.com/electrode-io/electrode-native-manifest/blob/master/manifest.json), but that we recommend use of, for override Manifests.

This new structure get rid of the coupling between a Manifest entry and an Electrode Native version. This association proved to be too restrictive, getting in the way of advanced use cases.

The new `manifest.json` document associate a `manifest id` (manifest object key) to a set of native and javascript dependencies, as follow :

```json
{
  "default": {
    "targetNativeDependencies": [
      "react-native@0.59.4",
      "react-native-electrode-bridge@1.5.17",
      "react-native-maps@0.23.0",
    ],
    "targetJsDependencies": [
      "react@16.8.3"
    ]
  },
  "next": {
     "targetNativeDependencies": [
      "react-native@0.60.0",
      "react-native-electrode-bridge@1.5.18",
      "react-native-maps@0.24.0",
    ],
    "targetJsDependencies": [
      "react@17.0.0"
    ]
  }
}
```

The `default` manifest id will be picked up automatically, unless a different `manifest id` is explicitly provided to some `ern` commands that are accessing the manifest.

For example, you might want to define a `next` manifest id with upgraded dependencies versions, and from a specific branch of your MiniApps you can then run `ern upgrade-miniapp --manifestId next` which will upgrade the MiniApp dependencies to the versions specified in the `next` manifest entry, while your main MiniApp branches can continue tracking the `default` Manifest entry. This was not possible previously due to the fact that Manifest entries had a one to one mapping to a specific platform version.

#### Guidelines for overriding Manifest use cases

If you want to override the master manifest in order to keep specific native dependencies versions over time, you should choose a Electrode Native version and reuse the native dependencies versions associated with it--to override the native dependencies in newer versions of Electrode Native. This practice allows users to update their Electrode Native version-while keeping the same native dependencies versions used with a previous version of Electrode Native.

For example, you use the array of native dependencies versions declared for ern 0.4.0 to re-use it as such for versions 0.5.0 and 0.6.0 of Electrode Native, overriding the native dependencies array of 0.5.0 and 0.6.0 defined in the master Manifest.

You can also choose to change a native dependency version from the version used by the master manifest; however, this type of change loses the version alignment guarantee and makes it difficult to add open-sourced MiniApps to your mobile application.

If you want to override the master manifest to use private (not open sourced) native modules in your MiniApps, or if you want to contribute to Electrode Native by adding the support for an not-already supported open source native module to the master Manifest, you'll need to create native modules (plugins) configuration in the manifest file.
