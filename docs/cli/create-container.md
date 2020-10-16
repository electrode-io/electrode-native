## `ern create-container`

#### Description

- Create a new Container project locally.

#### Syntax

`ern create-container`

**Options**

`--baseComposite <compositePath>`

- Git or File System path, to the custom Composite repository (refer to the [custom Composite] documentation for more information).

`--descriptor/-d <descriptor>`

- Create a new container including all the MiniApps listed in the Cauldron for the given _complete native application descriptor_
- Use this option if you want to locally generate a container that mirrors the container of a given native application version.

`--devJsBundle`

- Will generate a development JavaScript bundle rather than a production one.
  **Default** false

`--fromGitBranches`

- Create Container using the latest commits made to each of the MiniApp branches (HEAD), rather than using the MiniApps SHAs that are inside the current Container version.
- This flag is only used when creating a Container from a Cauldron descriptor
- This flag will be ignored if the target descriptor does not contain any MiniApps tracking git branches
  **Default** false

`--miniapps/-m <miniapps>`

- Create a new custom container including all the given MiniApps
- The MiniApps passed to this command can be a valid Yarn package format or a Git format or file scheme.

`--platform/-p <android|ios>`

- Specify the target platform for this container
- If not explicitly provided, the command prompts you to choose between the iOS or the Android platform before execution.

`--outDir/--out <directory>`

- Specify the directory to output the generated container to
- The output directory should either not exist (it will be created) or be empty
- **Default** If this option is not provided, the container is generated in the default platform directory `~/.ern/containergen/out`.

`--ignoreRnpmAssets`

- Inform the Container generator to ignore any rnpm assets optionally declared by MiniApps. This can be used in case you want to keep specific rnpm assets inside the native application itself and not the Container.
- This flag wil have no effect for a Container generated from a Cauldron as the Container configuration stored in the Cauldron will take precedence.
- **Default** Do not ignore rnpm assets and package them inside the generated Container.

`--extra/-e`

- Optional extra configuration specific to creating container
- Override some ios or android container generation configuration by passing `androidConfig` and/or `iosConfig` attributes
  - **As a json string**
    For example `--extra '{"androidConfig": {"androidGradlePlugin": "3.2.1","buildToolsVersion": "28.0.3","compileSdkVersion": "28","gradleDistributionVersion": "4.6","minSdkVersion": "19","sourceCompatibility": "VERSION_1_8","supportLibraryVersion": "28.0.0","targetCompatibility": "VERSION_1_8","targetSdkVersion": "28"}}'`
    or
    `--extra '{"iosConfig": {"deploymentTarget": "11.0"}}'`
  - **As a file path**
    For example `--extra /Users/username/my-container-config.json`
    In that case, the configuration will be read from the file.
  - **As a Cauldron file path**
    For example `--extra cauldron://config/container/my-container-config.json`
    In that case, the configuration will be read from the file stored in Cauldron.
    For this way to work, the file must exist in Cauldron (you can add a file to the cauldron by using the [ern cauldron add file] command).

`--skipInstall`

- Only used when generating an iOS Container with React Native >= 0.61.
- When set, skip `yarn install` and `pod install` after generating the container.
- **default** true on Windows/Linux, false on macOS

`--sourceMapOutput`

- Path to source map file to generate for this container bundle

`--resetCache`\

- Indicates whether to reset the React Native cache prior to bundling
- **Default** false

#### Remarks

- The `ern create-container` command can be used to create a container locally, for development, debugging and experimentation purposes.
- Container generation and transformation/publication are separate processes (see `Related commands` section below for specific commands)
- To create a container that is published so that your native application team can use the container, you should use one of the Cauldron commands to add your MiniApps to a specified native application version in the Cauldron, which will trigger the generation and publication of a Container. See _Related commands_.

#### Related commands

[ern transform-container] | Transform a local Container.
[ern publish-container] | Publish a local Container.
[ern create-composite] | Creates a JS Composite project locally

[ern transform-container]: ./transform-container.md
[ern publish-container]: ./publish-container.md
[ern create-composite]: ./create-composite.md
[custom composite]: ./platform-parts/composite/index.md
