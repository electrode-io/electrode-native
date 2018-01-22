## `ern code-push release`

[code-push commands prerequisites] needs to be met in order to execute this command

#### Description

* Release one or more MiniApp(s) version(s) to one or more released native application version(s).
* Perform compatibility checks to ensure that the new MiniApp(s) version(s) are compatible with the target native application version(s).
* Update the Cauldron with a new `CodePush` entry containing data about the release.

**Note:** The `ern code-push <miniapps..>` command can release JavaScript code only, not native. Therefore compatibility checks will ensure that the MiniApp(s) native dependencies are compatible with the versions running in the target native application version.

#### Syntax

`ern code-push release`  

**Options**  

`--miniapps`

* One or more MiniApps (separated by spaces) version(s) to CodePush.
* Only NPM published versions can be provided.
* You cannot use the `file` or `git` schemes for the MiniApp(s).

`--jsApiImpls`

* One or more JS API implementations (separated by spaces) version(s) to CodePush.
* Only NPM published versions can be provided.
* You cannot use the `file` or `git` schemes for the MiniApp(s).

`--descriptors/-d <descriptors..>`

* Specify one or more target native application version to release the MiniApp(s) to, following the *complete native application descriptor* format.

`--semVerDescriptor`

* A native descriptor using a semantic version string for its version. The release will target all versions matching the semver.

If no `descriptors` nor a `semVerDescriptor` is specified, the command will list all released native application versions stored in the Cauldron and will display a prompt to select one or more target native application version(s).

`--force/-f`

* Bypass all compatibility checks and force OTA update through CodePush.
* **Default** false

`--deploymentName/-d <deploymentName>`

* Specify the CodePush deployment name that this update is targeting (Production, Staging ...)
* **Default**  The command will display a prompt asking to input the deployment name. If deployment names for your native applications are stored in the Cauldron, the prompt will display the deployment names and ask to select one.

`--mandatory/-m`

* Specify that the release is mandatory (will be immediately downloaded and installed).
* **Default**  false

`--rollout/-r <percentage>`

* Specify the percentage of users who will have access to this release.
* **Default**  100

`--skipConfirmation/-s`

* Skip confirmation prompts
* **Default** false

#### Remarks

* MiniApps are packaged in a single JavaScript bundle. If the native application version contains 5 MiniApps and only one MiniApp is updated, then the remaining 4 MiniApp versions will remain untouched in the bundle.

#### Related commands

[code-push promote] | Promote a release to a different deployment name  
[code-push patch] | Patch a release
 
[code-push promote]: ./promote.md
[code-push patch]: ./patch.md