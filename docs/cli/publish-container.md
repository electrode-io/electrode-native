## `ern publish-container`

#### Description

- This command can be used to publish a local Container to a repository, using a given publisher.

### Currently Available Official Publishers

- [git](https://github.com/electrode-io/ern-container-publisher-maven)  
  To publish Android and iOS Electrode Native Containers to a remote git repository. The git repository provider does not matter (GitHub, BitBucket, TFS ...).

- [maven](https://github.com/electrode-io/ern-container-publisher-maven)  
  To publish Android Electrode Native Containers to a local or remote Maven repository.

- [jcenter](https://github.com/electrode-io/ern-container-publisher-jcenter)  
  To publish Android Electrode Native Containers to a remote JCenter repository.

- [dummy](https://github.com/electrode-io/ern-container-publisher-dummy)  
  This publisher is mostly used for testing and as starter simple publisher reference to create your own. It does not actually publish the Containers anywhere.

#### Syntax

`ern publish-container`

**Options**

`--containerPath`

- The local file system path to the directory containing the Container to publish.
- **Default** If this option is not provided, the command will look for a Container in the default platform directory `~/.ern/containergen/out/[platform]`.

`--platform`

- Specify the native platform of the target Container to publish (`android` or `ios`)
- This option is required, there is no default.

`--version/-v`

- Specify the Container version to use for publication.
- The version must be in the format: `x.y.z` where x, y and z are integers. For example `version=1.2.30`.
- Defaults to `1.0.0`.

`--publisher/-p`

- Specify the Container publisher to use.
- This option is required, there is no default.
- You can also use a local file system path to a Container publisher package (only used for developing custom publishers)

`--url/-u`

- The url to publish the Container to
- Some publishers might not need an url. Check the specific Container publisher documentation for reference

`--extra/-e`

- Extra configuration specific to the publisher used.
- Some publishers might not need an extra configuration. Check the Container publisher documentation for reference.
- There is three different ways to provide the json extra configuration :
  - **As a json string**  
    For example `--extra '{"configKey": "configValue"}'`
  - **As a file path**  
    For example `--extra <path>/publisher-config.json`  
    In that case, the configuration will be read from the file.
  - **As a Cauldron file path**  
    For example `--extra cauldron://config/publishers/publisher-config.json`  
    In that case, the configuration will be read from the file stored in Cauldron.  
    For this way to work, the file must exist in Cauldron (you can add a file to the cauldron by using the [ern cauldron add file] command).

`--inPlace`

- Run the publisher directly from the container directory instead of a temporary directory
- Defaults to `false`

#### Related commands

[ern create-container] | Create a new container (native or JavaScript only) locally to the workstation.

[ern create-container]: ./create-container.md
[ern cauldron add file]: ./add/file.md
