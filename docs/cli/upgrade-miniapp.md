## `ern upgrade-miniapp`

#### Description

* Upgrades a MiniApp to the currently activated platform version

#### Syntax

`ern upgrade-miniapp`

**Options**  

`--version/-v <version>`

* Upgrade the MiniApp to a specific platform version  

`--manifestId <manifestId>`

* Id of the override Manifest entry to retrieve dependencies versions from (see [override Manifest] for more info)

#### Remarks

* Based on your preference, you can select which package manager (`npm` or `yarn`) to be used by this command when updating the packages versions. This can be done by adding or updating `packageManager` field in the `ern` object kept in the MiniApp package.json. For example, to use `npm`. If this field is missing from configuration, `yarn` will be used over `npm` if it is installed on the workstation.

```json
{
  "ern": {
    "packageManager": "npm"
  }
}
```

[override Manifest]: ../platform-parts/manifest/override.md
