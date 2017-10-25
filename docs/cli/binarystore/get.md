## `ern binarystore get`

#### Description

* Get a mobile application binary from the binary store

#### Syntax

`ern binarystore get <descriptor> <outDir>`

**Arguments**  

`<descriptor>`

* A complete native application descriptor (ex: `myapp:android:1.0.0`), representing the native application version associated to this binary.

`<outDir>`

* Relative or absolute path to a directory where the binary will be transfered to. If the directory does not exist, it will be ecreated.

#### Remarks

* This command will only work if the following conditions are met:
  * A binary store server is running
  * There is an active Cauldron
  * The active Cauldron contains proper configuration of the binary store

* If a binary for the same native application version already exists in `outDir`, it will be replaced

* The binary will be named as follow `[mobile-app-name]:[platform]:[version].[ext]`  
For example, for `myapp:android:1.0.0`, the binary filename will be `myapp-android-1.0.0.apk`. For `myapp:ios:1.0.0` it will be `myapp-ios-1.0.0.app`.


#### Related commands
 [ern binarystore add] | Add a native application binary to the binary store  
 [ern binarystore remove] | Remove a native application binary from the binary store

___  

[ern binarystore add]: ./add.md

[ern binarystore remove]: ./remove.md