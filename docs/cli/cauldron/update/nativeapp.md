## `ern cauldron update nativeapp`

#### Description

* Update one or more properties of a native application version. 

#### Syntax

`ern cauldron update nativeapp <descriptor>`

**Arguments**

`<descriptor>`

* A complete native application descriptor representing the native application version to update.

**Options**  

`--isReleased`

* Release status of the native application version.  

`--description`  

* Description of the native application version.

#### Remarks

* The `descriptor` value should be a *complete native application descriptor*.  
* The `ern cauldron update nativeapp <descriptor>` command works only on a specified native application version.  
* Switching a native application version from `non released` status to `released` status changes the behavior of some commands.  

#### Related commands

[ern cauldron add nativeapp] | Add a new native application version to the currently activated Cauldron

[ern cauldron add nativeapp]: ../add/nativeapp.md
