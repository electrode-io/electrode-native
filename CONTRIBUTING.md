# Contributing

You can contribute to the Electrode Native open source project in several ways:

- As an Electrode Native user, if you face any issue with the platform, open a [new issue].
- While reading the documentation, if you notice a typo, misleading or wrong information, or missing content, edit the documentation and open a Pull Request. Using GitHub, this can be done online without having to clone the repository.
- If you want to suggest a new feature or an improvement for an existing one, create a [new issue]. Labels are used to classify issues.
- In case you would like to use a native module that is not currently supported by Electrode Native, create a plugin configuration in the [electrode-native-manifest][10] repo. See [Reusing existing native modules](https://native.electrode.io/reference/index-3#reusing-existing-native-modules) for more information.
- Resolve an [open issue]. For this you'll have to [set up your workstation](#Electrode-Native-development-setup) to be able to work on the platform code, as explained below.
- You can also contribute to [react-native-electrode-bridge].

## Electrode Native development prerequisites

You'll need to install [Yarn][3].

Electrode Native uses [Yarn Workspaces][1] and [Lerna][2] to manage `ern-` modules, which in turn uses Yarn instead of npm to install all `ern-` module dependencies.

## Electrode Native development setup

1. If you have not already installed the global CLI, install it by running the following command:

    ```bash
    npm install -g electrode-native
    ```

1. Clone the `electrode-native` repository.

1. In your local working directory of the `electrode-native` repository, run the following command:

    ```bash
    node setup-dev
    ```

   It takes care of installing dependencies for all Electrode Native modules, creates a new local version `1000.0.0` of the platform, and installs [Git hooks](#git-hooks).

1. Upon completion, use the following command to switch Electrode Native to this version:  

    ```bash
    ern platform use 1000.0.0
    ```

    Version `1000.0.0` is the development version pointing to your Electrode Native working folder.

    This version transpiles the code on the fly, which means that any code modification you'll make to any of the modules will be immediately reflected when running `ern` commands.

With this setup, you can also use Electrode Native as any other non-developer user. You can install new released platform versions or even switch between versions.  
The only difference with a regular user will be that you'll have access to version `1000.0.0` of the platform, which is the development version.

## Electrode Native development remarks

Electrode Native workspace is composed of multiple independent packages (all prefixed by `ern-`) that are managed by [Yarn Workspaces][1] and [Lerna][2].
When using the development version, after updating the repository, you might sometimes experience errors such as `Cannot find module ...` when running `ern` again. This is because some new package dependencies might have been added to one or more `ern-` modules and needs to be installed. The same applies if you add a new package dependency to the `package.json` of one of the `ern-` module project, you'll need to install it using Yarn.

The way to do this is to run `yarn && yarn build` in the root directory of the repository.

### Git hooks

The repo ships with several optional Git hooks. They will be activated
automatically when following the development setup instructions above, and can
also be activated manually using

```sh
cp -a .githooks/* .git/hooks/
```

- `post-merge`: Automatically install dependencies after a merge if yarn.lock was changed
- `pre-commit`: Run various checks, including the linter and formatter when creating a commit
- `pre-push`: Build the project and run unit tests before pushing a branch to a remote

## Guidelines for code contributions

### Type checking

Electrode Native uses [TypeScript] across all of its modules.

### Tests

Electrode Native contains two different test suites:
- Unit tests
- System tests

The unit test suite is not taking long to run, and will be run on any `git push`. You can also run them manually from the root of the repository: `yarn test:unit`. Tests from all modules will be executed.

System tests are running `ern` commands as a user would do. This test suite is taking longer to run than the unit tests one, and should mostly only be run following heavy modifications to the code base. They can be launched by running `yarn test:system` from the root repository.

Our tests are written using [mocha], chai and [sinon].

### Coverage

We use [nyc][5] to generate and report test coverage.

Use the following commands to get coverage reports locally:

- `yarn coverage:unit`\
Generates a unit tests coverage report
- `yarn coverage:system`\
Generate a system tests coverage report
- `yarn coverage`\
Generate a combined UT/ST coverage report

Once done, the coverage will be reported in the terminal, together with an html
report in the `coverage` directory.

Combined UT/ST coverage on the default branch is posted daily to [coveralls][6].

## Guidelines for documentation contributions

We use [GitBook] for our documentation.  

All our documentation pages are stored as markdown files withing the `/docs` directory.

If you need to make light edits to our documentation, such as simple rewording or fixing a few typos in a page, the simplest way is to edit the page directly on GitHub. If you are looking at the documentation online, click the `Edit this page` button in the top left corner of the page, which will take you to the page in GitHub.  

From there, click the `Edit this file` button and make your modifications. You can then select the option `Create a new branch for this commit and start a pull request` at the bottom of the page to create a Pull Request for your change.

In case you need to go through more heavy edits (reformatting, adding pages, adding images, working on templatized content -android v.s ios-), you might want to visualize your changes before actually opening a Pull Request, just to make sure the updated content is properly rendered by GitBook.

Thanks to the [GitBook CLI], it is actually quite simple to setup a GitBook server locally, so that you can see how your changes will look like in the online documentation once processed by GitBook. Here are the steps:

1. Install the GitBook CLI

    ```sh
    npm install -g gitbook-cli
    ```

1. Install the GitBook plugins used for Electrode Native documentation. Make sure you’re in the `electrode-native` directory:

    ```sh
    gitbook install
    ```

1. Run the GitBook server locally

    ```sh
    gitbook serve
    ```

1. Navigate to http://localhost:4000 to view the GitBook with your changes

You can keep the server running. Any time you'll do a change in the documentation, the content will be automatically regenerated.

## Continuous Integration

We use [GitHub Actions][4] and [Azure DevOps] for our Continuous Integration (CI).

The CI jobs run on every opened Pull Request (PR). It will run lint checks along with all the unit tests, in parallel, on Linux, macOS, and Windows, as well as the unit tests on a Linux node for different Node versions.

Another CI job is taking care of running the complete system test suite daily.

## Releasing new platform versions

Contributors with permissions to run workflows in the repo can use GitHub
Actions to version and publish new releases of the platform.

### Step 1: [version.yml][7] (triggered manually)

Once the repo is in a state ready for a new release, use the version workflow
to trigger the versioning process.

- Open the [version workflow][7] and click the gray "Run workflow" dropdown
- Select the correct branch
  - The default branch for a new minor release
  - An existing `v0.x` branch for a new patch release
- Click the green "Run workflow" button

The workflow will create the new release branch (for minor releases), update
versions, commit changes, create tags, and push everything back to the repo. It
will then create a draft GitHub Release with auto generated release notes for
the new version.

### Step 2: [publish.yml][8] (runs when a GitHub Release is published)

After all versioning is done there is a final chance to verify everything works
as expected before publishing the new version to npm.

- Fetch from the repo
- Validate locally

Once verified:

- Go to [GitHub Releases][9] and select the new draft
- Check and update release notes as necessary
- Click Publish

[Azure DevOps]: https://dev.azure.com/ElectrodeNative/Electrode%20Native/_build?definitionId=1&_a=summary

[new issue]: https://github.com/electrode-io/electrode-native/issues/new

[open issue]: https://github.com/electrode-io/electrode-native/issues

[react-native-electrode-bridge]: https://github.com/electrode-io/react-native-electrode-bridge

[TypeScript]: https://www.typescriptlang.org/

[mocha]: https://mochajs.org/

[sinon]: https://sinonjs.org/

[gitbook]: https://www.gitbook.com

[gitbook cli]: https://github.com/GitbookIO/gitbook-cli

[1]: https://yarnpkg.com/lang/en/docs/workspaces/
[2]: https://github.com/lerna/lerna
[3]: https://github.com/yarnpkg/yarn
[4]: https://github.com/electrode-io/electrode-native/actions/
[5]: https://github.com/istanbuljs/nyc
[6]: https://coveralls.io/github/electrode-io/electrode-native
[7]: https://github.com/electrode-io/electrode-native/actions/workflows/version.yml
[8]: https://github.com/electrode-io/electrode-native/actions/workflows/publish.yml
[9]: https://github.com/electrode-io/electrode-native/releases
[10]: https://github.com/electrode-io/electrode-native-manifest
