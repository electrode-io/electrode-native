**Adds a new native application version in a Cauldron**

The following command can be used to add a new native application version to the currently activated Cauldron.  

This is ususally done when the development of a new version of the native application is started.  

### Command

#### `ern cauldron add nativeapp <descriptor>`

Add a new empty native application version, identifed by the given `complete native application descriptor`, in the `Cauldron`.  

*Example :* `ern cauldron add nativeapp MyNativeApp:ios:17.14.0`

#### `ern cauldron add nativeapp --copyPreviousVersionData/-c`

Copy the data of the previous matching native application version stored in the Cauldron (if any) when creating the native application version.  

This will effectively copy the list of `native dependencies` and `MiniApps` as well as the `container version` from the previous matching native application version (if any), to avoid having to add all `MiniApps` again after creating a new native application version in the Cauldron.  
This option should in theory always be used, unless you have a very valid reason not to use it.  
If this option is not set, the command will ask if you wish to copy data over from previous native application version or not.