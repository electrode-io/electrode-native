## GitHub Commands

### Prerequisites

- `ERN_GITHUB_TOKEN` environment variable must be set.   
This is a `Personal Access Token`, generated from GitHub, having read/write access to the different repositories.

- If you are not using `github.com` but your own GitHub enterprise server, the API url should be set in cauldron `github` configuration as `baseUrl`. If your repositories are in `github.com`, nothing needs to be done.

```json
{
  "github": {
    "baseUrl": "https://company-github-host/api/v3"
  }
}
```

### Usage

The `github` commands can be used to automate some advanced custom development/release workflows when working with MiniApps / JS API Implementations that are handled as GitHub urls in the Cauldron rather than npm published versions.

For example, in a hypothetical development workflow for `MyAwesomeApp Android` you might use dummy version `1000.0.0` in your Cauldron, with all MiniApps tracking the `master` branch. Then to regenerate a new development Container, you would invoke [ern cauldron regen-container] container, which would pull the latest from the `master` branches, generate and publish a new Container and update the `SHAs` in the Cauldron.

Let's assume there are three tracked MiniApps from version `1000.0.0`, this would result in the following entry in the Cauldron (excluding some data):

```json
{
  "name": "1000.0.0",
  "container": {
    "miniApps": [
      "git+ssh://git@github.com/username/example1-miniapp.git#346f8f185f4bfc5de0c694918e131eec1847dab0",
      "git+ssh://git@github.com/username/example2-miniapp.git#d4ced142494b7f02c9038c805ca13229d2e32415",
      "git+ssh://git@github.com/username/example3-miniapp.git#ec1a90be810e1dc6668f5a7c2ec25e3302799cdd"
    ],
    "miniAppsBranches": [
      "git+ssh://git@github.com/username/example1-miniapp.git#master",
      "git+ssh://git@github.com/username/example2-miniapp.git#master",
      "git+ssh://git@github.com/username/example3-miniapp.git#master"
    ]
  }
}
```

Your mobile application release workflow might include a `code-freeze`, where release branches are cut for all MiniApps.
For example, assuming you are preparing release of version `1.0.0` of your mobile application, what could be done is the following :

- Create new application version `MyAwesomeApp:android:1.0.0` in Cauldron using [ern cauldron add nativeapp] command, copying data over from `1000.0.0` version.
- Create new `release-1.0.0` branches in all MiniApps repositories, using the [ern github create-ref] command.
- Update `MyAwesomeApp:android:1.0.0` MiniApps in the Cauldron, to track this new `release-1.0.0` branch rather than `master`, using the [ern cauldron update miniapps] command.

This would result in the following entry in Cauldron:

```json
{
  "name": "1.0.0",
  "container": {
    "miniApps": [
      "git+ssh://git@github.com/username/example1-miniapp.git#346f8f185f4bfc5de0c694918e131eec1847dab0",
      "git+ssh://git@github.com/username/example2-miniapp.git#d4ced142494b7f02c9038c805ca13229d2e32415",
      "git+ssh://git@github.com/username/example3-miniapp.git#ec1a90be810e1dc6668f5a7c2ec25e3302799cdd"
    ],
    "miniAppsBranches": [
      "git+ssh://git@github.com/username/example1-miniapp.git#release-1.0.0",
      "git+ssh://git@github.com/username/example2-miniapp.git#release-1.0.0",
      "git+ssh://git@github.com/username/example3-miniapp.git#release-1.0.0"
    ]
  }
}
```

Then it's possible to regenerate post freeze Containers for `1.0.0`, by just using [ern cauldron regen-container] command for `1.0.0`. As long as MiniApp developers are pushing post code freeze bug fixes to the `release-1.0.0` of the MiniApps branches. Developers can continue pushing changes to their main branch to continue generating development Containers for the next release.

At release time (when `1.0.0` is released to the store) you might want to create tags in the MiniApps repositories, to exactly know what was shipped for each MiniApps.

One way to do that is to just use the [ern github create-ref] command, this time to create tags (`v1.0.0` for example), from the current SHAs stored for the MiniApps, and then use [ern cauldron update miniapps] command to update the Cauldron. This would result in the following entry in Cauldron:

```json
{
  "name": "1.0.0",
  "container": {
    "miniApps": [
      "git+ssh://git@github.com/username/example1-miniapp.git#v1.0.0",
      "git+ssh://git@github.com/username/example2-miniapp.git#v1.0.0",
      "git+ssh://git@github.com/username/example3-miniapp.git#v1.0.0"
    ],
    "miniAppsBranches": [
    ]
  }
}
```

[ern github create-ref]: ./github/create-ref.md
[ern cauldron regen-container]: ./cauldron/regen-container.md
[ern cauldron add nativeapp]: ./cauldron/add/nativeapp.md
[ern cauldron update miniapps]: ./cauldron/update/miniapps.md
