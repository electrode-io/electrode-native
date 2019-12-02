## `ern github align-dependencies`

[github commands prerequisites] must be met in order to execute this command.

#### Description

* Update the `package.json` of all MiniApps and/or JS API Implementations GitHub repositories to make their dependencies align with the versions defined in a Manifest entry.

* The `package.json` will be updated through a git commit on the current branch of each MiniApp/JS API Implementation defined in the Container of the target descriptor.

* This command will not update `package.json` of MiniApps/JS API Implementations that are already fully aligned.

#### Syntax

`ern github align-dependencies`

**Options**  

`--descriptor <descriptor>`

* A full native application descriptor (native application version) from which to look for the MiniApps/JS API Implementations repositories (and branches) to align.
* **Default** Interactive prompt to select a descriptor.

`--manifestId`

* Id of the manifest entry that contains the dependencies and versions to align to.

[github commands prerequisites]: ../github.md