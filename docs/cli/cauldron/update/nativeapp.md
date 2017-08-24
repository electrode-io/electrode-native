**Update native application data in the Cauldron**

This command can currently only update the release status of a given native application version in the Cauldron. 

### Command

#### `ern cauldron update nativeapp <descriptor> [isReleased]`

Updates the release status of a given native application version. 
The `descriptor` should be a `complete native application descriptor` as this command can only work on a given native application version.  
`isReleased` is optional, and is set to `true` by default.  

Switching a native application version from `non released` status to `released` status will  change the behavior of some commands. When a native application version is released, on one hand, its container is frozen, nothing can be added or removed from it. On the other hand, it acivates the possibility to perform `CodePush` updates targeting this native application version, through the `ern code-push` command.