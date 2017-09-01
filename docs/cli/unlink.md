**Unlinks a given MiniApp directory**

Please refer to `ern link` command documentation to get the context about this command, as it can only be executed withing a `MiniApp` directory that was previously linked using `ern link` command.

### Command

#### `ern unlink`

This command needs to be run from within a `MiniApp` working directory that was linked through `ern link`. It removes the link associated to this `MiniApp` so that the packager launched through `ern start` won't use this `MiniApp` folder any longer to load the code of the `MiniApp`.