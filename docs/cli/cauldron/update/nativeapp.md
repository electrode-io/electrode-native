## `ern cauldron update nativeapp <descriptor> [isReleased]`
#### Description
* Update the release status of a native application version in the Cauldron.  

#### Syntax
`ern cauldron update nativeapp <descriptor> [isReleased]`

**Options**  

`isReleased`

* The release status is optional.  
* **Default**  The release status is true.  

#### Remarks
* The `descriptor` value should be a *complete native application descriptor*.  
* The `ern cauldron update nativeapp <descriptor> [isReleased]` command works only on a specified native application version.  
* Switching a native application version from `non released` status to `released` status changes the behavior of some commands.  
* When a native application version is released, its container is frozen and nothing can be added or removed from the container. However, you can use `CodePush` updates targeting this native application version using the `ern code-push` command.
