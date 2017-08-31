**Update one or more MiniApp(s) over the air**

This command can be used to update one or more `MiniApp(s)` over the air (without having to go through a native application store release) in a target released native application version. 

It will run compatiblity checks before-hand to ensure that the new `MiniApp(s)` version(s) are compatible with the target native application version. Indeed, `CodePush` can only push JavaScript code changes, not native ones. Therefore `ern` needs to ensure that the `MiniApp(s)` native dependency(ies) is/are properly aligned with the versions running in the target native application version. 

Upon sucessful execution of this command, the `Cauldron` will be updated with a new `CodePush` entry containing the version(s) of all the `MiniApp(s)` that were part of this publication, for tracking purposes (and to support platform inner workings).

Please note that you can only use `MiniApp(s)` versions that have been published to NPM, and cannot use `file` or `git` scheme for the `MiniApp(s)` you add through this command. If one of these conditions is not met, the command will fail with an error.

Because we are currently packaging all the `MiniApp(s)` in a single bundle, if the native application version contains 5 `MiniApps` and you are updating the version of a single one amongst the 5, then the 4 other `MiniApps` versions will be left untouched in the bundle.

This command mirrors some of the command options available in `code-push release-react`. Under the hood, it will actually execute `code-push release-react` command. 

### Command

#### `ern code-push <miniapps..>`

Publish one or more `MiniApp(s)` to a target released native application version, as an over the air update.
This command does not have to be run from within a `MiniApp` working directory.  
The `MiniApp(s)` will be retrieved from NPM and therefore should be versioned NPM package descriptor(s) corresponding to the published `MiniApp(s)` version(s). 

#### `ern code-push <miniapps..> --descriptor/-d <descriptor>`

Allows to specify a target native application version to publish the new `MiniApp(s)` version(s) to, using a `complete native application descriptor` from the `Cauldron`. 
If this option is not used, the command will list all released native application versions from the Cauldron and will prompt to choose one.

#### `ern code-push <miniapps..> --appName <appName>`

The `code-push` application name that this update is targeting.  
If this option is not used, it will infer the application name from the `complete native application descriptor` and ask for confirmation.

#### `ern code-push <miniapps..> --deploymentName/-d <deploymentName>`

The `code-push` deployment name that this update is targeting. 
If this option is not used, the command will prompt you for the deployment name to target. It is possible to store the deployment names for your native application in the `Cauldron`. In that case a list will be displayed with all the deployment name and `ern` will prompt to choose the target one.

#### `ern code-push <miniapps..> --platform/-p <android|ios>`

The platform targeted by this update. If this option is not used, it will infer the platform from the `complete native application descriptor` and ask for confirmation.

#### `ern code-push <miniapps..> --targetBinaryVersion/-t <targetBinaryVersion>`

Allow to specify which version(s) of the native application to target.

#### `ern code-push <miniapps..> --mandatory/-m` 

Used to denote that this update is a mandatory one. It will be installed immediately after being downloaded. By default, updates are non mandatory.

#### `ern code-push <miniapps..> --rollout/-r <rollout>`

Percentage of users this release should be immediately available to. It defaults to `100%`.

### Remarks

This command is the `ern` equivalent of `code-push release-react` command.