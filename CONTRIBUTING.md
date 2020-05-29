## Contributing to Electrode Native

You can contribute to the Electrode Native open source project in several ways:

- As an Electrode Native user, if you face any issue with the platform, you can open a [new issue].
- While reading the documentation, if you notice any typo (even a minor typpo ;), any misleading or wrong information or missing content, you can edit the documentation directly and issue a Pull Request. Using GitHub, this can be done online without having to fork the repository on your workstation.
- If you want to suggest a new feature or an improvement for an existing one, you can create a [new issue]. Over time, we will create labels to easily classify issues.
- In case you would like to use a native module that is not currently supported by Electrode Native, you can contribute a plugin configuration in the master manifest to add support for this native module. Check the documentation on [Reusing existing native modules](https://native.electrode.io/reference/index-3#reusing-existing-native-modules) for more information.
- By resolving an [open issue]. For this you'll have to setup your workstation accordingly to be able to work on the platform code, as explained below.
- You can also contribute to the [Electrode Native Bridge] library.

## Electrode Native development prerequisites

You'll need to install [Yarn][3].

Electrode Native is using [Yarn Workspaces][1] and [Lerna][2] to manage `ern-` modules, which in turn use Yarn instead of NPM to install all `ern-` module dependencies.

## Electrode Native development setup

If you want to contribute code to the Electrode Native platform, you'll first need to setup a development environment to work on Electrode Native. It's actually quite easy to start working on the platform.

1. If you have not already installed the platform, install by running the following command:

    ```bash
    npm install -g electrode-native
    ```

1. Fork and clone the `electrode-native` repository.

1. In your local working directory of the `electrode-native` repository, run the following command:

    ```bash
    node setup-dev
    ```

   It takes care of installing all the needed dependencies for all Electrode Native modules, and creates a new local version `1000.0.0` of the platform.

1. Upon completion, use the following command to switch Electrode Native to this version:  

    ```bash
    ern platform use 1000.0.0
    ```

    Version `1000.0.0` is the development version and it points to your Electrode Native working folder.

    This version is also taking care of running transpilation of the code on the fly, which means that any code modification you'll make to any of the modules will be immediately reflected when running any `ern` command.

With this setup, you can also use Electrode Native as any other non-developer user. You can install new released platform versions or even switch between versions.  
The only difference with a regular user will be that you'll have access to version `1000.0.0` of the platform, which is the development version.

## Electrode Native development remarks

Electrode Native workspace is composed of multiple independent packages (all prefixed by `ern-`) that are managed by [Yarn Workspaces][1] and [Lerna][2].
When using the development version, after pulling the latest from our `master`, you might sometimes experience errors such as `Cannot find module ...` when running `ern` again. This is because some new package dependencies might have been added to one or more `ern-` modules and needs to be installed. The same applies if you add a new package dependency to the `package.json` of one of the `ern-` module project, you'll need to install it using Yarn.

The way to do this is to just run `yarn && yarn build` in the root directory of your Electrode Native clone.

## Guidelines for code contributions

### Type checking

Electrode Native uses [TypeScript] across all of its modules.

[TypeScript] comes with integration support for many JavaScript editors. If you want to see [flow] errors from within your editor, please check the list of supported [flow editors] and configure your editor accordingly.

Electrode Native has a pre-commit hook setup, that will run [tslint] for every commit. In case a commit contains some flow errors, it won't go through. You'll have to fix the error(s) first before being able to commit your changes.

### Tests

Electrode Native contains two different test suites :
- Unit tests
- System tests

The unit test suite is not taking long to run, and will be run on any `git push`. You can also run them manually, by running `yarn test:unit` from the root of the `electrode-native` directory. Tests from all modules will be executed.

System tests are running `ern` commands as a user would do. This test suite is taking way longer to run than the unit tests one, and should mostly only be run following heavy modifications to the code base. They can be launched by running `yarn test:system` from the root of the `electrode-native` directory.

Our tests are written using [mocha], [chai] and [sinon].

### Coverage

We are using [nyc][5] to generate and report test coverage.

The following commands can be used to get coverage reports locally:

- `yarn coverage:unit`\
To generate and report unit tests coverage
- `yarn coverage:system`\
To generate and report system tests coverage
- `yarn coverage:all`\
To generate and report combined UT/ST coverage

Once done, the coverage will be reported in the terminal.\
An html report will also be generated in the `coverage` directory.

Combine UT/ST coverage of the `master` branch is posted daily to [coveralls][6].

## Guidelines for documentation contributions

We are using [GitBook] for our documentation.  

All our documentation pages are stored as markdown files withing the `/docs` directory.

If you need to make light edits to our documentation, such as simple rewording or fixing a few typos in a page, the simplest way is to just edit the page directly from GitHub. Just navigate to the page in our GitHub repository, or if you are looking at the documentation online, just click the `Edit this page` button in the top left corner of the page, which will take you to the page in GitHub.  

From there, just click the `Edit this file` button and make your modifications. You can then select the option `Create a new branch for this commit and start a pull request` at the bottom of the page to automatically issue a Pull Request for your change.

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

We are using [Azure DevOps] for our Continuous Integration (CI).

The CI job is run on every opened Pull Request (PR). It runs [TSLint][4] checks along with running all of the unit tests, in parallel, on Windows, Linux and OSX, as well as running all of the unit tests on a Linux node for different Node versions (8/10 and 12).

We will only merge PRs that pass the CI (green status). TSLint checks are automatically run for you on every commit, and unit tests will be executed on git push, so you should not have any surprise for these checks when it comes to the CI.

Another CI job is taking care of running the complete system test suite daily.

[Azure DevOps]: https://dev.azure.com/ElectrodeNative/Electrode%20Native/_build?definitionId=1&_a=summary

[new issue]: https://github.com/electrode-io/electrode-native/issues/new

[open issue]: https://github.com/electrode-io/electrode-native/issues

[Electrode Native Bridge]:https://github.com/electrode-io/react-native-electrode-bridge

[CLI]: https://github.com/electrode-io/electrode-native/blob/master/docs/platform-parts/cli.md#ern-local-client

[editor plugins]: https://standardjs.com/awesome.html#editor-plugins

[TypeScript]: http://www.typescriptlang.org/

[mocha]: https://mochajs.org/

[chai]: http://chaijs.com/

[sinon]: http://sinonjs.org/

[gitbook]: https://www.gitbook.com

[gitbook cli]: https://github.com/GitbookIO/gitbook-cli

[1]: https://yarnpkg.com/lang/en/docs/workspaces/
[2]: https://github.com/lerna/lerna
[3]: https://github.com/yarnpkg/yarn
[4]: https://palantir.github.io/tslint/
[5]: https://github.com/istanbuljs/nyc
[6]: https://coveralls.io/github/electrode-io/electrode-native
