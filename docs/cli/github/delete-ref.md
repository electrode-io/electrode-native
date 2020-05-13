## `ern github delete-ref`

[github commands prerequisites] must be met in order to execute this command.

#### Description

- Deletes a remote branch or tag in all MiniApps and/or JS API Implementations GitHub repositories.

#### Syntax

`ern github delete-ref`

**Options**

`--branch <name>`

- Name of the branch to delete.
- **Default** Interactive prompt to input a branch name.

`--tag <name>`

- Name of the tag to delete.
- **Default** Interactive prompt to input a tag name.

`--descriptor <descriptor>`

- A full native application descriptor (native application version) from which to look for the MiniApps/JS API Implementations repositories to delete the branch/tag from.
- **Default** Interactive prompt to select a descriptor.

`--jsApiImplsOnly`

- Only delete branch/tag in JS API Implementations repositories.
- **Default** Delete branch/tag in MiniApps and JS API Implementations repositories.

`--miniAppsOnly`

- Only delete branch/tag in MiniApps repositories.
- **Default** Delete branch/tag in MiniApps and JS API Implementations repositories.

[github commands prerequisites]: ../github.md
