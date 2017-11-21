## `ern code-push patch`

[code-push commands prerequisites] needs to be met in order to execute this command

#### Description

* Patch a CodePush release.
* This command only works for entries that have been released through `ern code-push release` or promoted through `ern code-push promote`.
* Update the corresponding CodePush entry in Cauldron with the changes.

#### Syntax

`ern code-push patch`  

**Options**  

`--descriptor/-d <descriptor>`

* Specify a target native application version (following the *complete native application descriptor* format) that contains the CodePush release to patch.
* **Default**  The command will list all released native applications versions stored in the Cauldron and will prompt to select a target native application version from the list.

`--label/-l`

* Specify the `label` (identifier) of the CodePush release to patch.
* **Default** The command will display a prompt to input the label.

`--disabled/-x`

* Update the distribution status of the matched CodePush release. Setting this flag to `true` will disable the CodePush release distribution, while setting this flag to `false` will enable the CodePush release distribution.
* **Default** No change to the distribution status.

`--deploymentName/-d <deploymentName>`

* Update the CodePush deployment name (Production, Staging ...) of the matched release.
* **Default** No change to the deployment name.

`--mandatory/-m`

* Update the mandatory status of the CodePush release entry. Setting this flag to `true` will make the CodePush release mandatory (it will be immediately downloaded and installed), whereas setting this flag to `false` will make the CodePush release non mandatory.
* **Default** No change to the mandatory status.

`--rollout/-r <percentage>`

* Update the percentage of users who will have access to the CodePush release.
* **Default**  No change to the rollout percentage.

#### Related commands

[code-push promote] | Promote a release to a different deployment name  
[code-push release] | Issue a CodePush release
 
[code-push promote]: ./promote.md
[code-push release]: ./release.md
[code-push commands prerequisites]: ../code-push.md