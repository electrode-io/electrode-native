**Creates a new Native or JS only container**

This command can be used to create a `Container` locally, for development, debugging and experimentation purposes. 
If you instead want to create a container that gets published, so that your native application team can use it, you should instead use one of the `Cauldron` commands to add your `MiniApp(s)` to a given native application version in the `Cauldron`, which will in turn trigger the generation and publication of a `Container`. Check out `ern cauldron add miniapp` for more details.

### Command

#### `ern create-container`

This will create a new container, locally to the workstation.
For Android, in addition of being generated, the `Container` will also get published to your local Maven repository.  

#### `ern create-container --version/-v <version>`

Specify the `version` to use for the Container. The version should comply with the form `x.y.z` where x, y and z are integers (for example `version=1.2.30`)  
If you don't provide an explicit version, the default version `1.0.0` will be used.

#### `ern create-container [--jsOnly/--js]`

This will create a JavaScript only container (a.k.a MiniApps composite). If not specified, a full native container (including the JS bundle containing all MiniApps) will be generated.

#### `ern create-container --decriptor/-d <descriptor>`

This will create a new container including all the `MiniApps` listed in the `Cauldron` for the given `complete native application descriptor`.
This is useful if you want to locally generate a container that mirrors the one of a given native application version.  

#### `ern create-container --miniapps/-m <miniapps>`

This will create a new custom container including all the given `MiniApps`. The `MiniApps` passed to this command can be any valid `yarn` package format (you can even use git and/or file scheme).

#### `ern create-container --platform/-p <android|ios>`

Specify the target platform for this container. 
If not explicitely provided, the command will prompt you to choose between `ios` and `android` platform before execution.

#### `ern create-container [--outDir/-o] <directory>`

Specify the output directory where the container generated project should be stored upon creation. If not provided, the container will be generated in the default platform directory `~/.ern/containergen/out`.
