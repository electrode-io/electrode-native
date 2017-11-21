## `ern code-push promote`

#### Description

* Promote a CodePush release to a different deployment name and/or native application versions.

#### Syntax

`ern code-push promote`  

**Options**  

`--sourceDescriptor <descriptor>`

* Specify the native application version from which to promote a release in the form of a *complete native application descriptor*.
* The release to be promoted will be the latest non disabled release of this native application version.
* **Default** The command will list all released native applications versions stored in the Cauldron and will prompt to select a target native application version from the list.

`--targetDescriptors <descriptors..>`

* Specify one or more target native application version to promote the release to, in the form of a *complete native application descriptor* list (separated by spaces).
* The target descriptor can be the same as the source descriptor if the promotion is just changing the deployment name (for example promoting a release from Staging to Production for the same native application version).

`--targetSemVerDescriptor <descriptor>`

* A native descriptor using a semantic version string for its version. The promotion will target all native application versions matching the semver.

If no `targetDescriptors` nor a `targetSemVerDescriptor` is specified, the command will list all released native application versions stored in the Cauldron and will display a prompt to select one or more target native application version(s) for the promotion.

`--sourceDeploymentName`

* The deployment name of the release to promote (Staging for example).
* **Default** The command will prompt to input the deployment name, or display a list of deployment names stored in the Cauldron, to choose from.

`--targetDeploymentName`

* The deployment name to promote the release to (Production for example).
* **Default** The command will prompt to input the deployment name, or display a list of deployment names stored in the Cauldron, to choose from.

`--mandatory/-m`

* Specify that the promoted release is mandatory (will be immediately downloaded and installed).
* **Default**  false

`--rollout/-r <percentage>`

* Specify the percentage of users who will have access to this release.
* **Default**  100

`--skipConfirmation/-s`

* Skip confirmation prompts
* **Default** false

#### Related commands

[code-push release] | Issue a CodePush release 
[code-push patch] | Patch a release
 
[code-push release]: ./release.md
[code-push patch]: ./patch.md