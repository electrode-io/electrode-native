## `ern cauldron del nativeapp`

#### Description

* Remove a native application entry from a Cauldron

#### Syntax

`ern cauldron del nativeapp <descriptor>` 

**Arguments**

`<descriptor>` 

* A partial native application descriptor or a complete native application descriptor representing the native application entry to be removed from the Cauldron.

**Example**  

`ern cauldron del nativeapp TestApp`  
Remove the native application named `TestApp` from the cauldron.  
This includes removing all platforms and versions of this native application from the Cauldron.

`ern cauldron del nativeapp TestApp:android`  
Remove the android platform entry of `TestApp` from the Cauldron.  
This includes removing all versions entries in Cauldron of `TestApp` for `android` platform, but will other platform versions untouched.

`ern cauldron del nativeapp TestApp:android:1.0.0`  
Remove version `1.0.0` of the `TestApp` `android` from the Cauldron.  
All other versions of `TestApp` `android` will remain untouched.

#### Remarks

* The `ern cauldron del nativeapp <descriptor>` command is rarely used for Cauldrons in production environments.  
