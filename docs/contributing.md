# Contributing to Electrode React Native

There are a few different ways you can contribute to Electrode React Native:

- As a user of Electrode React Native, if you face any issue with the platform, you can open a [new issue].  

- While reading the documentation, if you notice any typo (even minor), any misleading or wrong information or even missing content, you can edit the documentation and issue a Pull Request. Thanks to GitHub, this process can entirely be done online without even having to fork the repository on your workstation.

- If you want to suggest a new feature, or an improvement for an existing one, you can just create a [new issue]. We will use labels at some point to easily filter things out. 

- In case you'd like to use a native module that is not currently supported by Electrode React Native, 

- By taking care of an [open issue]. For this you'll have to setup your workstation accordingly to be able to work on the platform code.

- You can also contribute to the [Electrode React Native Bridge] library.

## Electrode React Native development setup

In the case you want to contribute some code to the platform, you'll need to setup a development environment to work on Electrode React Native.

It's actually quite easy to start working on the platform.

What you'll need first is to make sure that you have installed the platform, as any user, through:   

`$ npm install -g electrode-react-native`

Once done, make sure that you can run the [CLI] by running `ern` in a terminal. If that is the case, good news, you are almost setup for development.

The next thing you'll want to do is to `fork` the `electrode-react-native` repository.

Then, all you are left with is to run `node setup-dev` from your local working directory of `electrode-react-native` repository.

This little script will take care of installing all the needed dependencies for all ern modules, and will create a new local version `1000.0.0` of the platform.

Upon completion, you'll be able to switch to this local development by running  

`$ ern platform use 1000.0.0`

This special version will point to your `Electrode React Native`  working folder. It is also setup to run transpilation of the code on the fly, which means that any code modification you'll make to any of the modules will be reflected upon next run of `ern` command.

With this setup, you can also still use `Electrode React Native` as any other non developer user. You can install new platform versions or switch between versions. The only difference with a regular user will be that you'll have access to version `1000.0.0` of the platform, which is your development version.

## Guidelines for code contribution

### Coding style

We are currently using [Standard JS] for our JavaScript code style rules.

If you want to see Standard warnings during development, you might consider configuring your JavaScript editor accordingly. Many editors have built-in support for [Standard JS]. Just check out their documentation regarding [editor plugins].

You can also run [Standard JS] manually on `Electrode React Native` through `npm standard`.

`Electrode React Native` has a pre-commit hook setup, that will run `standard` for every commit. In case a commit is not meeting some `standard` rules, it won't go through. You'll have to fix the issue(s) first before being able to commit your changes.

### Type checking

`Electrode React Native` is using [flow] accross all of its modules. 

[flow] comes with integration support for many JavaScript editors. If you want to see [flow] erros from within your editor, please check the list of supported [flow editors] and configure your editor accordingly.

You can also run [flow] manually on `Electrode React Native` through `npm flow`.

`Electrode React Native` has a pre-commit hook setup, that will run `flow` for every commit. In case a commit contains some `flow` errors, it won't go through. You'll have to fix the error(s) first before being able to commit your changes.

### Tests

Tests can be run through running `npm test` from the root of `electrode-react-native` directory. Tests from all modules will be executed.

Our tests are written using [mocha], [chai] and [sinon].

The tests are not executed on every commit. Ideally, you should run the test suite before opening a PR.

[new issue]: https://github.com/electrode-io/electrode-react-native/issues/new

[open issue]: https://github.com/electrode-io/electrode-react-native/issues

[Electrode React Native Bridge]:https://github.com/electrode-io/react-native-electrode-bridge

[CLI]: https://github.com/electrode-io/electrode-react-native/blob/master/docs/platform-parts/cli.md#ern-local-client

[editor plugins]: https://standardjs.com/awesome.html#editor-plugins

[standard JS]: https://standardjs.com/

[flow]: https://flow.org/

[flow editors]: https://flow.org/en/docs/editors/

[mocha]: https://mochajs.org/

[chai]: http://chaijs.com/

[sinon]: http://sinonjs.org/