## `ern cauldron batch`

#### Description

* Combine multiple Cauldron operations in a single command  

#### Syntax

`ern cauldron batch`  

**Options**  

`--addMiniapps <miniapps..>`

* Add one or more MiniApp versions to a target native application version Container


`--updateMiniapps <miniapps..>`

* Update the version of one or more MiniApps in a target native application version Container


`--delMiniapps <miniapps..>`

* Remove one or more MiniApps from a target native application version Container  

`--resetCache`\

* Indicates whether to reset the React Native cache prior to bundling
* **Default** false

#### Remarks

* The `ern cauldron batch [--option <value..>]` command performs operations in the following order:  

1) [delMiniapps]  
2) [updateMiniapps]  
3) [addMiniapps]

* The following types of MiniApp paths are not supported by `--addMiniapps` and `--updateMiniApps` :
  - File path (ex `file://Users/foo/MiniApp`)
  - Git path missing branch/tag or commit sha (ex: `https://github.com/foo/MiniApp.git`)
  - Registry path missing version (ex: `MiniApp`)
  - Registry path using a version range (ex: `MiniApp@^1.0.0`)

[delMiniapps]: del/miniapps.md
[updateMiniapps]: update/miniapps.md
[addMiniapps]: add/miniapps.md
