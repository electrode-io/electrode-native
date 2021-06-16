## Electrode Native Composite

The Composite is a JavaScript project that is used by Electrode Native to combine all MiniApps (and optional JS API Implementations) in a single JS bundle.

A Composite project is created behind the scene, in a temporary directory, every time a Container is generated, and Electrode Native will run `react-native bundle` on this Composite project to create the JS bundle and assets to store in the Container.

Electrode Native will also create a Composite when using [ern start] command, to assemble all MiniApps together and launch the react native local packager (`react-native start` on this Composite).

You can also manually generate a Composite project, with the [ern create-composite] command.

## Babel support

Electrode Native has support for using Babel plugins in MiniApps.
Babel support is still in an early phase and will be improved and simplified over time.
To enable proper Babel support for a MiniApp, here are the requirements :

- Have a `.babelrc` file at the root of the MiniApp, containing the Babel configuration. Electrode Native doesn't support `babel.config.js` which is appropriate for a top level babel configuration, but given that the MiniApps will end up inside a Composite, they won't be top level anymore.

- Set `useBabelRc` to `true` in the `ern` section of the MiniApp `package.json`, as follow :

  ```json
  "ern": {
    "useBabelRc": true
  }
  ```

  This is required so that Electrode Native can let Babel know that this MiniApp should be added to the [babelrcRoots](https://babeljs.io/docs/en/options#babelrcroots).

- Make sure that all Babel plugins used by the MiniApp are inside the `dependencies` sections of the `package.json` rather than `devDependencies`. This is not the standard, and can look unclean, however it won't have any nasty side effects. The reason for this constraint is that when Electrode Native generates a Composite with one or more MiniApp(s) it `yarn add` (`npm install`) each of the MiniApps in the Composite project, which does not install any `devDependencies` of the the MiniApps. Therefore, if Babel plugins are kept inside `devDependencies` they won't be installed during Composite generation, and bundling/packaging will fail when trying to resolve babel plugins.

### Note for [babel-plugin-module-resolver](https://github.com/tleunen/babel-plugin-module-resolver)

If this plugin is being used, in the Babel plugin config (in `.babelrc`) the [`cwd` option](https://github.com/tleunen/babel-plugin-module-resolver/blob/v3.2.0/DOCS.md#cwd) should be set to `babelrc`. This is needed, otherwise the base directory for `root` will resolve to top level composite rather than the MiniApp root directory.

### Note regarding BABEL_ENV

React Native Metro bundler will [force set `BABEL_ENV`](https://github.com/facebook/metro/blob/fcb096d3286c67cac8a727c23f1e97be98a04cf5/packages/metro-react-native-babel-transformer/src/index.js#L152-L154) environment variable during transpilation to one out of only two values : `development` or `production`. Keep that in mind if using the [`env` option](https://new.babeljs.io/docs/en/next/babelrc.html#env-environment-option) in a Babel configuration. Whatever value is manually set for `BABEL_ENV` will be overwritten during transpilation by Metro bundler.

`development` will be set for any development bundle (local packager for example) and `production` will be set for any production bundle (bundle that we store in Container).

## Selective dependency resolutions support

Because Electrode Native uses [yarn](https://yarnpkg.com) under the hood to generate the Composite project, it also supports yarn [selective dependency resolutions](https://yarnpkg.com/lang/en/docs/selective-version-resolutions/) feature.
This feature allows you to force version resolution of selected dependencies to specific versions.
It can be very useful in certain context. For example if a deeply nested package that you don't have direct control on is breaking because a newer version has a bug, you can easily force the use of a previous version while waiting for package maintainer to publish a new version of it.
Resolutions configuration can be done in the `compositeGenerator` config in the Cauldron. It can also be supplied directly to some commands such as `run-android`/`run-ios` or `create-container` via the `--extra` object option. The `resolutions` field is a 1:1 mapping to the `resolutions` field that will be added to the `package.json` of the composite. Refer to the [selective dependency resolutions](https://yarnpkg.com/lang/en/docs/selective-version-resolutions/) documentation for more information.

```json
"config": {
  "compositeGenerator": {
    "resolutions": {
      "d2/left-pad": "1.1.1",
      "c/**/left-pad": "1.1.2"
    }
  }
}
```

Please note that this configuration will be ignored if you are using a custom composite. Because a custom composite offers full control of the Composite project, it is the responsibility of the custom composite project maintainer to manually add `resolutions` to the `package.json` of the custom composite.

### Custom `extraNodeModules` in Metro config

Custom entries to the `resolver.extraNodeModules` property in `metro.config.json` can be added via the
`metroExtraNodeModules` field. It supports both relative and absolute paths. Relative paths will resolve to
`node_modules` inside the Composite project.

```json
"config": {
  "compositeGenerator": {
    "metroExtraNodeModules": {
      "pkg-a": "@scope/new-pkg-a",
      "pkg-b": "/absolute/path/to/new-pkg-b"
    }
  }
}
```

Similar to selective dependency resolutions described above, custom extraNodeModules are only supported for a full
composite. When using a custom composite, `metro.config.json` should be modified directly.

## Note in regards to local `.npmrc`

When generating a Composite, Electrode Native will not consider any local `.npmrc` file present in the root of a MiniApp.
This is due to the fact that when generating a Composite project, Electrode Native just `yarn add` every MiniApp to the Composite project. Each MiniApp becomes a dependency of the Composite project and is not a top level app anymore.
Therefore, when needing a custom `.npmrc` configuration, the `.npmrc` should be global rather than local, or be part of a custom Composite project (see below).

## Using a custom Composite

In the majority of cases, there is no need to create a custom composite, as Electrode Native comes with a built-in one. However in some specific cases, having more control on the Composite project is needed. For example, you might want to add some custom initialization code for the whole bundle, or you might want more control on some configuration files (`rn-cli.config.js`/ `metro.config.js`/`babel.config.js`).

Setting up a custom Composite project (also known as a base Composite) for Electrode Native is relatively straightforward.

This can be achieved in two steps:

1. Create the Composite git repository
2. Configure Electrode Native to use custom Composite rather than the one built-in

### Create the custom Composite git repository

This git repository should just contain a basic React Native project structure.
You can create your own, or copy our [starter custom composite](https://github.com/electrode-io/ern-base-composite-starter).

For example this is the basic file structure of our sample bare custom Composite:

```
.
├── babel.config.js
├── composite-imports.js  [GENERATED/OVERWRITTEN]
├── index.js              [REQUIRED]
├── metro.config.js
├── package.json
└── rn-cli.config.js

```

There are two important things -as of now- to be aware of, when creating a custom Composite project :

1. `index.js` is required. This will be the entry file used when running`react-native bundle`/`react-native start`.

2. `composite-imports.js` will be generated by Electrode Native. It will contain all of the MiniApps / JS API Impls imports. You have to import this file in `index.js` at some point, otherwise your MiniApps won't be packaged in the bundle. Keep in mind that this file, if present in the repo, will be overwitten by Electrode Native during composite generation, so don't put custom imports or code in this one.

Also, the `name`/`version` in the `package.json` and other fields that only matter for npm publication can be left to dumnmy values. This Composite project is not meant to be published to npm but solely used to create the Composite JS bundle.

### Configure Electrode Native to use custom Composite

Once the custom Composite project is created, and published to a git repository, the next step is to configure Electrode Native so that it relies on this custom Composite project rather than its own.

#### Through Cauldron

If you want to use a custom Composite repository `custom-composite` stored in GitHub under user `username`, your `compositeGenerator` configuration should be as follow :

```json
"config": {
  ...
  "compositeGenerator": {
    "baseComposite": "git+ssh://github.com/username/custom-composite.git"
  }
}
```

It is also possible to specify a specific branch/tag or SHA. For example, using the same repository, but pulling from `mybranch`, the configuration will be the following :

```json
"config": {
  ...
  "compositeGenerator": {
    "baseComposite": "git+ssh://github.com/username/custom-composite.git#mybranch"
  }
}
```

As for all configuration stored in the Cauldron, there is no way yet to add or edit the configuration using `ern` commands. You should manually edit your Cauldron.
Also, as a reminder, `config` objects can be stored at different levels in the Cauldron, respectively :

```
. Root
|_ Native Application
  |_ Native Application Platform
    |_ Native Application Version
```

depending on the level of granularity you desire. For exmaple, when looking for configuration for `MyApp:android:1.0.0`, Electrode Native will first look for a `config` object at the native application version level, and if not found will bubble up the levels until it finds it (or doesn't).

#### Through Commands

Electrode Native contains a few commands that are generating a Composite as part of their execution, and that can be used without relying on a Cauldron.

- [ern code-push release]
- [ern create-composite]
- [ern create-container]
- [ern run-ios]
- [ern run-android]
- [ern start]

These commands are exposing a `baseComposite` option being either a valid git repository path or a local path on the workstation to a custom composite project. Please note that using this option will take precedence over any `baseComposite` configuration stored in Cauldron.
If you are using a Cauldron, there is very limited use to explicitly providing the `baseComposite` to these command.

This option can however be very useful for experimentation or to test a custom Composite project before committing it to git / using it in Cauldron. For example, if your custom Composite project is stored in `/etc/custom-composite` you can easily try it out with some of the commands above, before committing it to git / setting it up in Cauldron.

## Electrode Native internal flow with custom Composite

When detecting a custom Composite project, Electrode Native will do the following when generating the Composite :

- Clone the Composite repository to a temporary directory
- Checkout specific branch/tag/sha (if any specified)
- Run `yarn add` for all MiniApps / JS API Implementations part of the Composite (this will update the `package.json` of the Composite)
- Create the `composite-imports.js` file, containing all MiniApps/JS API Implementations imports.

This completes the Composite project generation. Optionally, based on the command used, `react-native bundle` or `react-native start` will be invoked with `index.js` as `entry-file` based on the platform being targeted.

[ern code-push release]: ../../cli/code-push/release.md
[ern create-composite]: ../../cli/create-composite.md
[ern start]: ../../cli/start.md
[ern create-container]: ../../cli/create-container.md
[ern run-android]: ../../cli/run-android.md
[ern run-ios]: ../../cli/run-ios.md
