**Removes a native application version from a Cauldron**

The following command can be used to remove a new native application from the currently activated Cauldron.  

This command should be of very rare use for production Cauldrons.

### Command

#### `ern cauldron del nativeapp <descriptor>`

Effectively removes the native application matching the provided `native application descriptor` from the Cauldron.  

The `descriptor` can be a `partial native application descriptor`, if you want to remove all versions of a given native application platform, or even all entries for a given native application name.  

To illustrate :

- `ern cauldron del nativeapp MyNativeApp`   
Will remove all entries for `MyNativeApp` from the Cauldron (all native application versions for both Android and iOS platforms) 

- `ern cauldron del nativeapp MyNativeApp:android`  
Will remove all versions of `MyNativeApp` just for the `Android` platform.

- `ern cauldron del nativeapp MyNativeApp:android:1.0.0`  
Will only remove the version `1.0.0` of `MyNativeApp` for `Android` platform.