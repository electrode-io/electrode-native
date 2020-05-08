## `ern platform plugins search`

#### Description

- Search for a specified plugin for the active platform version
- Log search results to the terminal

#### Syntax

`ern platform plugins search <name>`

**Arguments**

`<name>`

- The name of the plugin to search for

**Options**

`[platformVersion]`

- Search for a specified plugin for a specific platform version

`--manifestId <manifestId>`

- Id of the override Manifest entry to retrieve dependencies versions from (see [override Manifest] for more info)

#### Remarks

- The search results include the plugin (if supported by the current platform version) and its version.

[override manifest]: ../../../platform-parts/manifest/override.md
