## `ern code-push promote`

code-push [prerequisites][1] need to be met in order to run this command

### Description

* Promote a CodePush release to a different deployment name and/or native application versions.

#### Syntax

```sh
ern code-push promote
```

#### Options

`--reuseReleaseBinaryVersion`

* Indicates whether to reuse the target binary version that was used for the initial release
* If omitted, and `targetBinaryVersion` is not set, the promotion will target the exact version of the descriptor
* This option is mutually exclusive with `targetBinaryVersion`

`--sourceDescriptor <descriptor>`

* Specify the native application version from which to promote a release in the form of a *complete native application descriptor*.
* The release to be promoted will be the latest non disabled release of this native application version.
* **Default** The command will list all released native applications versions stored in the Cauldron and will prompt to select a target native application version from the list.

`--targetDescriptors <descriptors..>`

* Specify one or more target native application version to promote the release to, in the form of a *complete native application descriptor* list (separated by spaces).
* The target descriptor can be the same as the source descriptor if the promotion is only changing the deployment name (for example promoting a release from Staging to Production for the same native application version).

`--targetSemVerDescriptor <descriptor>`

* A native descriptor using a semantic version string for its version. The promotion will target all native application versions matching the semver.

If no `targetDescriptors` nor a `targetSemVerDescriptor` is specified, the command will list all released native application versions stored in the Cauldron and will display a prompt to select one or more target native application version(s) for the promotion.

`--sourceDeploymentName`

* The deployment name of the release to promote (Staging for example).
* **Default** The command will prompt to input the deployment name, or display a list of deployment names stored in the Cauldron, to choose from.

`--targetDeploymentName`

* The deployment name to promote the release to (Production for example).
* **Default** The command will prompt to input the deployment name, or display a list of deployment names stored in the Cauldron, to choose from.

`--targetBinaryVersion/-t <targetBinaryVersion>`

* Semver expression that specifies the binary app version this promotion is targeting
* If omitted, and `reuseReleaseBinaryVersion` is not set, the promotion will target the exact version of the descriptor
* If `versionModifier` is specified in the codePush config, it will be applied
* For using `targetBinaryVersion` option users must target only 1 descriptor
* For using `targetBinaryVersion` option users cannot use semVerDescriptor
* This option is mutually exclusive with `reuseReleaseBinaryVersion`

`--mandatory/-m`

* Specify that the promoted release is mandatory (will be immediately downloaded and installed).
* **Default**  false

`--rollout/-r <percentage>`

* Specify the percentage of users who will have access to this release.
* **Default**  100

`--skipConfirmation/-s`

* Skip confirmation prompts
* **Default** false

`--force/-f`

* Bypass all compatibility checks and force OTA update through CodePush. **USE AT YOUR OWN RISK**
* **Default** false

`--label/-l`

* Promote the release matching this specific label.
* **Default** The latest release matching sourceDescriptor/sourceDeploymentName pair will be promoted.

`--description/--des`

* Description of the changes made to the app with this release. If omitted, the description from the release being promoted will be used.

* **Default** Empty string

`--disableDuplicateReleaseError`

* When this flag is set, promoting a package that is identical to the latest release on the target deployment will produce a warning instead of an error

* **Default** false

#### Related commands

* [code-push release][2] | Issue a CodePush release
* [code-push patch][3] | Patch a release

[1]: ../code-push.md
[2]: ./release.md
[3]: ./patch.md
