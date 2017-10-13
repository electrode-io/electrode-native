## `ern cauldron regen-container`

#### Description

Triggers the regeneration of a Container from the Cauldron.  

#### Syntax

`ern cauldron regen-container [-v/--containerVersion] [-d/--descriptor]`  

**Options**  

`-v/--containerVersion <version>`

* Specify the version of the new container.
* **Default**  Increment patch number of the current container version  
Example: If the current container version is 1.2.3 and a version is not included in the command, the new container version will be 1.2.4.
* You can only use a version that is greater than the current version of the Container.

`-d/--descriptor <descriptor>`

* The target native application version in the Cauldron (in the form of a complete native application descriptor) for which to regenerate the Container.
**Default**  Lists all non-released native application versions from the Cauldron and  prompts you to choose one.
**Example** `ern cauldron regen-api -d MyNativeApp:android:1.0.0`  

#### Remarks

* The [ern create-container] command can also generate a container given a complete native application descriptor. But the [ern create-container] will only create the Container locally and not update the Cauldron or publish the new version.  
* This command should only be used if you need to regenerate a Container for a native application version, without adding/removing/updating any MiniApp or native dependencies (very limited use case)

_________
[ern create-container]: ../create-container.md