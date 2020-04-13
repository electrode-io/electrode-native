## `ern code-push release`

code-push [prerequisites][1] need to be met in order to run this command

### Description

* Release one or more MiniApp(s) version(s) to one or more released native application version(s).
* Perform compatibility checks to ensure that the new MiniApp(s) version(s) are compatible with the target native application version(s).
* Update the Cauldron with a new `CodePush` entry containing data about the release.

**Note:** The `ern code-push <miniapps..>` command can release JavaScript code only, not native. Therefore compatibility checks will ensure that the MiniApp(s) native dependencies are compatible with the versions running in the target native application version.

### Syntax

```sh
ern code-push release
```

### Options

`--baseComposite <compositePath>`

* Git or File System path, to the custom Composite repository (refer to the [custom Composite documentation][4] for more information).

`--miniapps`

* One or more MiniApps (separated by spaces) version(s) to CodePush.
* You can use npm published versions or git based path (SHA or tag only).
* If you are CodePushing a MiniApp that is using a git path in Container, please CodePush using a git path. If you are CodePushing a MiniApp that is using a npm published version in the Container, please CodePush using an npm published version. Do not mix.
* You can't use the `file` scheme for the MiniApp(s).

`--jsApiImpls`

* One or more JS API implementations (separated by spaces) version(s) to CodePush.
* You can use npm published versions or git based path (SHA or tag only).
* If you are CodePushing a JS API implementation that is using a git path in Container, please CodePush using a git path. If you are CodePushing a JS API implementation that is using a npm published version in the Container, please CodePush using an npm published version. Do not mix.
* You can't use the `file` scheme for the MiniApp(s).

`--descriptors/-d <descriptors..>`

* Specify one or more target native application version to release the MiniApp(s) to, following the *complete native application descriptor* format.

`--semVerDescriptor`

* A native descriptor using a semantic version string for its version. The release will target all versions matching the semver.

If no `descriptors` nor a `semVerDescriptor` is specified, the command will list all released native application versions stored in the Cauldron and will display a prompt to select one or more target native application version(s).

`--sourceMapOutput`

* Path to source map file to generate for this code push bundle

`--force/-f`

* Bypass all compatibility checks and force OTA update through CodePush.
* **Default** false

`--deploymentName/-d <deploymentName>`

* Specify the CodePush deployment name that this update is targeting (Production, Staging ...)
* **Default**  The command will display a prompt asking to input the deployment name. If deployment names for your native applications are stored in the Cauldron, the prompt will display the deployment names and ask to select one.

`--targetBinaryVersion/-t <targetBinaryVersion>`

* Semver expression that specifies the binary app version this release is targeting
* If omitted, the release will target the exact version of the descriptor
* If versionModifier is specified in the codePush config , exact version of the descriptor is appended to versionModifier
* For using `targetBinaryVersion` option users must target only 1 descriptor
* For using `targetBinaryVersion` option users cannot use semVerDescriptor

`--mandatory/-m`

* Specify that the release is mandatory (will be immediately downloaded and installed).
* **Default**  false

`--rollout/-r <percentage>`

* Specify the percentage of users who will have access to this release.
* **Default**  100

`--skipConfirmation/-s`

* Skip confirmation prompts
* **Default** false

`--description/--des`

* Description of the changes made to the app with this release

* **Default** Empty String

`--disableDuplicateReleaseError`

* When this flag is set, releasing a package that is identical to the latest release will produce a warning instead of an error

* **Default** false

### Remarks

* MiniApps are packaged in a single JavaScript bundle. If the native application version contains 5 MiniApps and only one MiniApp is updated, then the remaining 4 MiniApp versions will remain untouched in the bundle.

### Related commands

* [code-push promote] | Promote a release to a different deployment name
* [code-push patch] | Patch a release

[1]: ../code-push.md
[2]: ./promote.md
[3]: ./patch.md
[4]: ../../platform-parts/composite/index.md
