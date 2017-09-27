# Contributing to the Electrode Native Open Source Project

You can contribute to the Electrode Native open source project in several ways:

- As an Electrode Native user, if you face any issue with the platform, you can open a [new issue].  

- While reading the documentation, if you notice any typo (even a minor typpo ;), any misleading or wrong information or missing content, you can edit the documentation directly and issue a Pull Request. Using GitHub, this can be done online without having to fork the repository on your workstation.

- If you want to suggest a new feature or an improvement for an existing one, you can create a [new issue]. Over time, we will create labels to easily classify issues.

- In case you would like to use a native module that is not currently supported by Electrode Native, you can contribute a plugin configuration in the master manifest to add support for this native module. Check the documentation on [Reusing existing native modules](https://electrode.gitbooks.io/electrode-native/content/platform-parts/manifest.html#reusing-exiting-native-modules) for more information.

- By resolving an [open issue]. For this you'll have to setup your workstation accordingly to be able to work on the platform code, as explained below.

- You can also contribute to the [Electrode Native Bridge](https://github.com/electrode-io/react-native-electrode-bridge) library.

## Electrode Native development setup

If you want to contribute code to the Electrode Native platform, you'll first need to setup a development environment to work on Electrode Native. It's actually quite easy to start working on the platform.

1) Using Terminal, enter the following command to make sure that you install the platform:  
 `$ npm install -g electrode-react-native`  

2) When installation is complete, enter `ern` to enter the [CLI] command mode.  

3) Using the Electrode Native CLI, use the `fork` command and the `electrode-react-native` command to fork the repository.  

4) From your local working directory of the `electrode-react-native` repository (change directories if necessary), enter the `node setup-dev` command.

This little script takes care of installing all the needed dependencies for all Electrode Native modules, and creates a new local version `1000.0.0` of the platform.

5) Upon completion, use the following command to switch to this local development.    
`$ ern platform use 1000.0.0`

Version `1000.0.0` is the development version and it points to your Electrode Native  working folder. It is also setup to run transpilation of the code on the fly, which means that any code modification you'll make to any of the modules will be reflected in the next run of the `ern` command.

With this setup, you can also use Electrode Native as any other non-developer user. You can install new platform versions or switch between versions. The only difference with a regular user will be that you'll have access to version `1000.0.0` of the platform, which is your development version.

## Continuous Integration

We are using [Travis] for our Continuous Integration (CI).

The CI job is run on every opened Pull Request (PR). It runs standard and flow checks along with running the whole platform test suite.

We only merge PRs that pass the CI (green status). Standard and flow checks are automatically run for you on every commit, so you should not have any surprise for these checks on the CI. However the tests are not automatically run on every commit, so before opening a PR please make sure that all tests are passing on your workstation by running the `npm run test` command.

## Guidelines for code contribution

### Coding style

We are using [Standard JS] for our JavaScript code style rules.

If you want to see Standard warnings during development, you might consider configuring your JavaScript editor accordingly. Many editors have built-in support for [Standard JS]. Just check out their documentation regarding [editor plugins].

You can also run [Standard JS] manually on Electrode Native through npm standard.

Electrode Native has a pre-commit hook setup, that runs standard for every commit. In case a commit is not meeting some standard rules, it won't go through. You'll have to fix the issue(s) first before being able to commit your changes.

### Type checking

Electrode Native uses [flow] across all of its modules.

[flow] comes with integration support for many JavaScript editors. If you want to see [flow] errors from within your editor, please check the list of supported [flow editors] and configure your editor accordingly.

You can also run [flow] manually on Electrode Native using the `npm flow` command.

Electrode Native has a pre-commit hook setup, that will run flow for every commit. In case a commit contains some flow errors, it won't go through. You'll have to fix the error(s) first before being able to commit your changes.

### Tests

Tests can be run by running the `npm test` command from the root of the `electrode-react-native` directory. Tests from all modules will be executed.

Our tests are written using [mocha], [chai] and [sinon].

The tests are not executed on every commit. Ideally, you should run the test suite before opening a PR.

[travis]: https://travis-ci.org/

[new issue]: https://github.com/electrode-io/electrode-react-native/issues/new

[open issue]: https://github.com/electrode-io/electrode-react-native/issues

[Electrode Native Bridge]:https://github.com/electrode-io/react-native-electrode-bridge

[CLI]: https://github.com/electrode-io/electrode-react-native/blob/master/docs/platform-parts/cli.md#ern-local-client

[editor plugins]: https://standardjs.com/awesome.html#editor-plugins

[standard JS]: https://standardjs.com/

[flow]: https://flow.org/

[flow editors]: https://flow.org/en/docs/editors/

[mocha]: https://mochajs.org/

[chai]: http://chaijs.com/

[sinon]: http://sinonjs.org/