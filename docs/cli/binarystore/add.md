## `ern binarystore add <descriptor> <pathToBinary>`

#### Description

* Add a mobile application binary to the binary store

#### Syntax

`ern binarystore add <descriptor> <pathToBinary>`

**Arguments**  

`<descriptor>`

* A complete native application descriptor (ex: `myapp:android:1.0.0`), representing the native application version associated to this binary.

`<pathToBinary>`

* Relative or absolute path to the binary to add to the binary store. For an `Android` binary the path should point to a `.apk` file, whereas of `iOS` it should point to a `.app`.

#### Remarks

* This command will only work if the following conditions are met:
  * A binary store server is running
  * There is an active Cauldron
  * The active Cauldron contains proper configuration of the binary store

* If a binary already exists in the store for the targeted native application version, it will be replaced.

#### Related commands

 [ern binarystore get] | Get a native application binary from the binary store  
 [ern binarystore remove] | Remove a native application binary from the binary store

___  

[ern binarystore get]: ./get.md

[ern binarystore remove]: ./remove.md