## `ern github delete-ref`

[github commands prerequisites] must be met in order to execute this command.

#### Description

* Deletes a remote branch or tag in all MiniApps and/or JS API Implementations GitHub repositories.

#### Syntax

`ern github delete-ref`

**Options**  

`--branch <name>`

* Name of the branch to delete.
* **Default** Interactive prompt to input a branch name.

`--tag <name>`

* Name of the tag to delete.
* **Default** Interactive prompt to input a tag name.

`--descriptor <descriptor>`

* A full native application descriptor (native application version) from which to look for the MiniApps/JS API Implementations repositories to delete the branch/tag from.
* **Default** Interactive prompt to select a descriptor.

[github commands prerequisites]: ../github.md