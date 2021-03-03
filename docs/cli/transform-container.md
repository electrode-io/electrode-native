## `ern transform-container`

### Description

- This command can be used to transform a local Container using a given Container transformer.

### Currently Available Official Transformers

- [pbxproj](https://github.com/electrode-io/ern-container-transformer-pbxproj)  
  Can be used to patch one or more pbxproj (iOS project file) included in the Container, in specific ways.

- [build-config](https://github.com/electrode-io/ern-container-transformer-build-config)  
  Can be used to update Build Configuration(s) -build settings- of a generated iOS Container.

- [script](https://github.com/electrode-io/ern-container-transformer-script)  
  This transformer allows for executing an arbitrary script to transform the Container in some custom way. It supports transformation of both iOS and Android Containers.

- [git-patch](https://github.com/electrode-io/ern-container-transformer-git-patch)  
  Can be used to apply one or more sequential git patches to the Container.

#### Syntax

`ern transformer-container`

**Options**

`--containerPath`

- The local file system path to the directory containing the Container to transform.
- **Default** If this option is not provided, the command will look for a Container in the default platform directory `~/.ern/containergen/out/[platform]`.=

`--platform/-p`

- Specify the native platform of the target Container to transform.
- This option is required, there is no default (unless `--descriptor` is used)

`--transformer/-t`

- Specify the Container transformer to use (for ex `build-config`).
- Can also include a specific version or a version range (for ex `build-config@1.0.0` or `build-config@^1.0.0`)
- If no version is specified, the latest available version of the publisher will be used at the time of publication (this is a bit risky given that new major publisher versions will contain breaking changes. We **recommend** that you use a specific version or version range allowing minor and patch updates only)
- It is also possible to pass a local file system path to a Container transformer package (only used for transformers development).
- This option is required, there is no default (unless `--descriptor` is used)

`--extra/-e`

- Extra configuration specific to the transformer (as json)
- Some transformers might not need any extra configuration. Check the specific Container transformer documentation for reference.
- There is three different ways to provide the json extra configuration :
  - **As a json string**  
    For example `--extra '{"configKey": "configValue"}'`
  - **As a file path**  
    For example `--extra <path>/transformer-config.json`  
    In that case, the configuration will be read from the file
  - **As a Cauldron file path**  
    For example `--extra cauldron://config/publishers/transformer-config.json`  
    In that case, the configuration will be read from the file stored in Cauldron.  
    For this way to work, the file must exist in Cauldron (you can add a file to the cauldron by using the [ern cauldron add file] command).

#### Related commands

[ern create-container] | Create a new Container (native or JavaScript only) locally to the workstation.  
[ern publish-container] | Publish a Container.

---

[ern create-container]: ./create-container.md
[ern publish-container]: ./publish-container.md
[ern cauldron add file]: ./add/file.md
