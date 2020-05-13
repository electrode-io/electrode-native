## `ern cauldron regen-container`

#### Description

Triggers the regeneration of a Container from the Cauldron.

#### Use Cases

- In case one or more MiniApps in the Container of a native application version are tracking a specific git branch (for example https://github.com/electrode-io/movielist-miniapp#master), using the `regen-container` command will trigger a new Container generation that will include the latest commits of the branch(es), if any.
- In case there was a problem with one of the plugin configuration stored in the Manifest, or if you are using a different version of Electrode Native with an updated native Container template, the only way to propagate these native changes to the Container would be to use this command (just make sure to use the `--fullRegen` flag in that case, to force a native Container project regeneration even though there was no changes to the list of native dependencies to be included in the Container).

#### Syntax

`ern cauldron regen-container`

**Options**

`-v/--containerVersion <version>`

- Specify the version of the new container.
- **Default** Increment patch number of the current container version  
  Example: If the current container version is 1.2.3 and a version is not included in the command, the new container version will be 1.2.4.
- You can only use a version that is greater than the current version of the Container.

`-d/--descriptor <descriptor>`

- The target native application version in the Cauldron (in the form of a complete native application descriptor) for which to regenerate the Container.
  **Default** Lists all non-released native application versions from the Cauldron and prompts you to choose one.
  **Example** `ern cauldron regen-api -d MyNativeApp:android:1.0.0`

`--fullRegen`

- Performs a complete Container generation even if there was no native dependencies changes.

`--resetCache`\

- Indicates whether to reset the React Native cache prior to bundling
- **Default** false

`--sourceMapOutput`

- Path to source map file to generate for this container bundle

#### Remarks

- The [ern create-container] command can also generate a container given a complete native application descriptor. But the [ern create-container] will only create the Container locally and not update the Cauldron or publish the new version.
- This command should only be used if you need to regenerate a Container for a native application version, without adding/removing/updating any MiniApp or native dependencies (very limited use case)

---

[ern create-container]: ../create-container.md
