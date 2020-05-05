## `ern github create-ref`

[github commands prerequisites] must be met in order to execute this command.

#### Description

* Creates a new remote branch or tag in all MiniApps and/or JS API Implementations GitHub repositories.

#### Syntax

`ern github create-ref` 

**Options**  

`--branch <name>`

* Name of the new branch to create.
* **Default** Interactive prompt to input a branch name.

`--tag <name>`

* Name of the new tag to create.
* **Default** Interactive prompt to input a tag name.

`--descriptor <descriptor>`

* A full native application descriptor (native application version) from which to look for the MiniApps/JS API Implementations to branch/tag.
* **Default** Interactive prompt to select a descriptor.

`--fromBranch`

* Creates the new branch/tag from the branches of the MiniApps/JS API Implementations listed in the target descriptor.
* **Default** Interactive prompt to select `--fromBranch/--fromTagOrSha` option to be used.

`--fromTagOrSha`

* Creates the new branch/tag from the current tags or SHAs of the MiniApps/JS API Implementations listed in the target descriptor.
* **Default** Interactive prompt to select `--fromBranch/--fromTagOrSha` option to be used.

`--jsApiImplsOnly`

* Only create new branch/tag for JS API Implementations.
* **Default** Creates branch/tag for MiniApps and JS API Implementations.

`--miniAppsOnly`

* Only create new branch/tag for MiniApps.
* **Default** Creates branch/tag for MiniApps and JS API Implementations.

[github commands prerequisites]: ../github.md
