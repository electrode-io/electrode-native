## `ern cauldron del nativeapp <descriptor>`
#### Description
* Remove a native application version from a Cauldron  

#### Syntax
`ern cauldron del nativeapp <descriptor>`  

#### Remarks
* The `ern cauldron del nativeapp <descriptor>` command is rarely used for Cauldrons in production environments.  
* The command `descriptor` specifies whether to remove:
  - All versions for a specified native application for both Android and iOS platforms.  
  - All versions of a specified native application on a specified platform
  - A specific version of a native application for a specified platform  


#### Examples
- `ern cauldron del nativeapp MyNativeApp`  
This example shows how to remove all entries for `MyNativeApp` from the Cauldron. This example removes all native application versions for both Android and iOS platforms.

- `ern cauldron del nativeapp MyNativeApp:android`  
This example shows how to remove all versions of `MyNativeApp` just for the Android platform.

- `ern cauldron del nativeapp MyNativeApp:android:1.0.0`  
This example shows how to remove a specified version: `1.0.0` of `MyNativeApp` for the Android platform.
