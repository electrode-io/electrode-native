# Debugging MiniApps

Debugging individual MiniApps (running _standalone_) works similar to debugging
regular React Native apps. See [Debugging][10] for more information.

The rest of this guide focuses on a setup to debug _multiple_ MiniApps with the
help of the [ern start][1] command and a local [Composite][6].

## Prerequisites

- All prerequisites of [React Native][8] and [Electrode Native][9]
- [Visual Studio Code][2]
- The VS Code [React Native Tools][3] extension

## Setup

### Step 1: Prepare working directory

Inside a new directory (e.g. `workspace`), clone all MiniApps that you want to
debug.

In this example, for two MiniApps `details-miniapp` and `list-miniapp`, the
directory structure should look like this:

```text
workspace/
├── details-miniapp/
└── list-miniapp/
```

### Step 2: Link MiniApps

Run `ern link` in each MiniApp directory.

The [ern link][5] command is needed to map the source location between the
composite and the MiniApp directory, but also to ensure that any changes to the
MiniApp directory are propagated to the Composite.

### Step 3: Initialize parent project

This is necessary for the [React Native Tools][3] extension to work properly.

Run `yarn init --yes` (or `npm init --yes`) in the parent directory
(`workspace`) to create a `package.json` file. Then add the React Native
dependencies:

```sh
yarn add react@16.8.6 react-native@0.60.6
```

Use the **same versions** of `react` and `react-native` that are used by the
MiniApps (in this example React Native 0.60.6).

The structure should now look like this:

```text
workspace/
├── details-miniapp/
├── list-miniapp/
├── node_modules/
├── package.json
└── yarn.lock
```

### Step 4: Create a debug configuration

#### Visual Studio Code

This configuration will be used to attach the [VS Code debugger][4] (actually
the [React Native Tools][3] debug adapter) to the native application.

Follow the instructions in [Launch configurations][11] to create a new launch
configuration and open the resulting `launch.json` file.

Manually add a `sourceMapPathOverrides` section to configure [sourcemaps][12]:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Attach to packager",
      "cwd": "${workspaceFolder}",
      "type": "reactnative",
      "request": "attach",
      "sourceMapPathOverrides": {
        "../../composite/node_modules/details-miniapp/*": "${workspaceFolder}/details-miniapp/*",
        "../../composite/node_modules/list-miniapp/*": "${workspaceFolder}/list-miniapp/*"
      }
    }
  ]
}
```

Note that the package name of the MiniApp could be different from the directory
name in the workspace folder.

```text
"../../composite/node_modules/[MINIAPP_PACKAGE_NAME]/*": "${workspaceFolder}/[MINIAPP_DIRECTORY_NAME]/*"
```

At this point our directory structure should look like:

```text
workspace/
├── .vscode/
│   └── launch.json
├── details-miniapp/
├── list-miniapp/
├── node_modules/
├── package.json
└── yarn.lock
```

The basic setup is now complete. If you need to add more MiniApps, clone them
into the `workspace` directory, run `ern link`, and add a corresponding mapping
entry to `sourceMapPathOverrides` configuration.

We can now start debugging with the help of the [ern start][1] command.

## Debugging

### Step 1: Create a composite

In order to debug and step through the code, we require a locally generated
[Electrode Native Composite][6] inside of the `workspace` directory.

Pass an absolute path as the `--compositeDir` parameter to `ern start`:

```sh
ern start [options] --compositeDir /path/to/workspace/composite
```

The MiniApps to include in the composite can be passed using the `--miniapp`
(or `-m`) flag. If no other options are defined, the `ern start` command
requires an active [Cauldron][7]. See `ern start --help` for more information.

Once composite generation is done, we should have the following structure:

```text
workspace/
├── .vscode/
│   └── launch.json
├── composite/
├── details-miniapp/
├── list-miniapp/
├── node_modules/
├── package.json
└── yarn.lock
```

### Step 2: Open the project and set breakpoints

Open the `workspace` directory in VS Code (if you have not done so already) and
launch the native application (if it is not already running). It may have been
launched automatically by `ern start`.

Now you may set breakpoints in the JavaScript code of the MiniApps.

### Step 3: Attach the debugger

To attach VS Code to the React Native debugger, run the _Attach to packager_
debug configuration. Make sure the `ern start` command has completed and is
still running in the background. You will notice an indicator that will keep
spinning until the next step is completed.

### Step 4: Enable JS Debugging in the app

In the native application, bring up the [React Native developer menu][10], and
turn on JS Debugging by tapping _Debug_ (Android) or _Debug JS Remotely_ (iOS).
This will result in attaching to the Visual Studio Code debugger. If debugging
was already turned on in the native app, disable it first, then re-enable it.
In VS Code you should now see that the debugger was attached. Check if the
breakpoints are triggered in the sources of `details-miniapp` and
`list-miniapp`, and debug the MiniApps in VS Code.

[1]: ../cli/start.md
[2]: https://code.visualstudio.com/
[3]: https://marketplace.visualstudio.com/items?itemName=msjsdiag.vscode-react-native
[4]: https://code.visualstudio.com/docs/editor/debugging
[5]: ../cli/link.md
[6]: ../platform-parts/composite/index.md
[7]: ../platform-parts/cauldron/index.md
[8]: https://reactnative.dev/
[9]: https://native.electrode.io/introduction/what-is-ern/requirements
[10]: https://reactnative.dev/docs/debugging
[11]: https://code.visualstudio.com/docs/editor/debugging#_launch-configurations
[12]: https://github.com/microsoft/vscode-chrome-debug/blob/master/README.md#sourcemaps
