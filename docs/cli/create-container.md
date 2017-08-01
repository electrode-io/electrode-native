**Creates a new Native or JS only container**

### Commands

#### `ern create-container`

This will create a new container

#### `ern create-container --version/-v <version>`

Specify the `version` to use for the container.  
You can use `version=auto` to auto increment the version of the container based on the version stored in the current Cauldron, or use a specific version (for example `version=1.2.3`)
Please note that if you are using a specific version, it will overwrite the current delcared version stored in your Cauldron

#### `ern create-container [--jsOnly/--js]`

This will create a JavaScript only container (a.k.a MiniApps composite).

#### `ern create-container --completeNapDescriptor/-n <descriptor>`

This will create a new container that will contain the `MiniApps` listed in the `Cauldron` for the given `Native Application Descriptor`.

#### `ern create-container --miniapps/-m <miniapps>`

This will create a new container that will contain the given `MiniApps`.

#### `ern create-container --platform/-p <android|ios>`

Specify the target platform for this container.

#### `ern create-container [--publish]`

Publish the container to Maven (Android) or GitHub (iOS) after creation.

#### `ern create-container [--outDir/-o] <directory>`

Specify the output directory where the container should be stored after creation.
