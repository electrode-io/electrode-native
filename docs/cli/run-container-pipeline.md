## `ern run-container-pipeline`

#### Description

- This command can be used to run a local pre-generated Container through a Container pipeline _(aribtrary sequence of transformers & publishers)_

#### Syntax

`ern run-container-pipeline`

**Options**

`--containerPath`

- The local file system path to the directory containing the Container to run through the pipeline.
- **Default** If this option is not provided, the command will look for a Container in the default platform directory `~/.ern/containergen/out/[platform]`.

`--pipeline`

- Path to the JSON file containing the pipeline configuration.
- Can either be a local file system path to the JSON file, or a path to a JSON file stored in the cauldron _(for example cauldron://config/my-pipeline.json for a my-pipeline.json file stored in config directory in the cauldron)_

`--platform`

- Specify the native platform of the target Container (`android` or `ios`)
- This option is required, there is no default.

`--version/-v`

- Specify the Container version to use for publication.
- The version will be ignored if the pipeline is only composed of transformers.
- Defaults to `1.0.0`.

#### Remarks

Refer to [container publication] and [container integration] documentation for more details regarding the structure of the JSON pertaining to pipeline configuration.

[container publication]: ../platform-parts/container/container-publication.md
[container integration]: ../platform-parts/container/container-integration.md
