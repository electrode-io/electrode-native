## `ern transform-container`

#### Description

* This command can be used to transform a local Container using a given Container transformer.

#### Syntax

`ern transformer-container`  

**Options**  

`--containerPath`

* The local file system path to the directory containing the Container to transform.
* **Default**  If this option is not provided, the command will look for a Container in the default platform directory `~/.ern/containergen/out/[platform]`.

`--platform/-p <android|ios>`

* Specify the native platform of the target Container to transform.
* This option is required, there is no default.

`--transformer/-t <transformer>`

* Specify the Container transformer to use (for ex `build-config`).
* A semantic version for the transformer can be specified (for ex `build-config@1.0.0` or `build-config@^1.0.0`).
* It is also possible to pass a local file system path to a Container transformer package (only used for transformers development).
* This option is required, there is no default.

`--config/-c <config>`

* Extra configuration specific to the transformer used.
* Some transformers might not need an extra configuration. Check the specific Container transformer documentation for reference.
* The configuration is a json document.
* Configuration can either be a json string or the path to a file holding the configuration.

#### Related commands

[ern create-container] | Create a new Container (native or JavaScript only) locally to the workstation.
[ern publish-container] | Publish a Container.

[ern create-container]: ./create-container.md
[ern publish-container]: ./publish-container.md