## `ern add`

#### Description

- Add one or more package (dependency) to the MiniApp

#### Syntax

`ern add <packages..>`

**Options**

`--dev/-d`

- Add the package(s) to the MiniApp `devDependencies`
- Checks are not performed to add development dependencies

`--peer/-p`

- Add the package(s) to the MiniApp `peerDependencies`
- Checks are not performed to add peer dependencies`

`--manifestId <manifestId>`

- ID of the override Manifest entry to retrieve dependencies versions from (see [override Manifest] for more info)

#### Remarks

- The `ern add <packages..>` command is the `ern` equivalent of `yarn add` and `npm install`
  When you work with a MiniApp, always use `ern add` to add packages in place of `yarn add` or `npm install`.

- Based on your preference, you can select which package manager (`npm` or `yarn`) to be used by this command to add the package. This can be done by adding or updating `packageManager` field in the `ern` object kept in the MiniApp package.json. For example, to use `npm`. If this field is missing from the configuration, `yarn` will be used over `npm` if it is installed on the workstation.

```json
{
  "ern": {
    "packageManager": "npm"
  }
}
```

- The `ern add <packages..>` command performs compatibility checks before adding the package to the project.

- You don't need to specify an explicit version for a package that you add using `ern add` as the version to use will be retrieved from the Manifest. If you add an explicit version for a package, it will be ignored.

- If the package is declared in the current platform manifest, then the version from the manifest is used.
- The `ern add <packages>` command performs the following checks:

* If the package is declared in the manifest, then `ern` installs the package at the version declared in the manifest.
* If the package is not declared in the manifest, then additional checks are performed:
  - If the package contains native code in any way (the package itself is a native module or it transitively contains one or more native dependencies, the command denies the package installation until a configuration is added to the manifest for this package.
  - If the package contains only JavaScript code, then the command proceeds with the package installation without further checks.

[override manifest]: ../platform-parts/manifest/override.md
