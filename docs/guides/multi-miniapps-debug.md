# Debugging Multiple MiniApps

This guide present a [Visual Studio Code] setup to debug multiple MiniApps with the help of [ern start] command.  

## Prerequisites

[Visual Studio Code] should be installed, as well as the [React Native Tools] extension.

## Setup

To make the setup easier to understand, let's illustrate it with an example.

Let's assume that we are working on an application that contains three different MiniApps (`MiniAppA` / `MiniAppB` and `MiniAppC`).  
We'd like to be able to run the native application and [debug](https://code.visualstudio.com/docs/editor/debugging) `MiniAppA` and `MiniAppC` in Visual Studio Code.  
We don't really care about being able to debug `MiniAppB` as we are not actively involved in its development.  
Also, let's assume that the package names of these MiniApps (as seen in `name` field of their `package.json`) are `miniapp-a`, `miniapp-b`, `miniapp-c`.

Given this, here is what we will do :

- Create a directory that will contain all the MiniApps that we need to debug in VSCode. Let's name this directory `ern-workspace` for example

```shell
$ mkdir ern-workspace
```

- Git clone (in this directory) all the MiniApps that we'd like to be able to debug, in our case `MiniAppA` and `MiniAppB`. 

At this point we now have the following directory structure

```
ern-workspace
├── MiniAppA
└── MiniAppC
```

- `ern link` each of the MiniApps

This is needed for proper mapping of source location between the composite and the MiniApp directory, but also to ensure that any changes to the MiniApp directory are properly propagated to the Composite.
We will just `cd` into our `MiniAppA` and `MiniAppC` directories and run `ern link` command from each of them.

- Create a node project in this directory, and add `react-native` dependency to it

This is necessary for the [React Native Tools] extension to properly work.

We will use `yarn` for this, but feel free to use `npm`, it does not really matter.

```shell
$ yarn init . --yes
$ yarn add react-native@0.60.5
```

Make sure to install the `react-native` version that is being used by the MiniApps (in this current scenario our MiniApps are using React Native 0.60.5).

Our directory structure should now look like this 

```
ern-workspace
├── MiniAppA
├── MiniAppC
├── node_modules
├── package.json
└── yarn.lock
```

- Create a Visual Studio Code debug configuration

This configuration will be used to attach the Visual Studio Code debugger (actually the [React Native Tools] debug adapter) to the native application.

We will create a new file `ern-workspace/.vscode/launch.json` with the following content:

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
                "../../composite/node_modules/miniapp-a/*": "${workspaceFolder}/MiniAppA/*",
                "../../composite/node_modules/miniapp-c/*": "${workspaceFolder}/MiniAppC/*"
            }
        }
    ]
}
```

Note that in the `sourceMapPathOverrides`, the MiniApp package names are used, and could differ from the name of the directory (name of the repo) that contains the source code of the MiniApp (in our case it is different indeed. For example `MiniAppA` package name is `miniapp-a`). If a MiniApp is using a scoped package name, make sure to include the scope as well in the path.

There should be one line per MiniApp in `sourceMapPathOverrides` configuration and it should always be formatted as follow :

```
"../../composite/node_modules/[MINIAPP_PACKAGE_NAME]/*": "${workspaceFolder}/[MINIAPP_DIRECTORY_NAME]/*"
```

`[MINIAPP_PACKAGE_NAME]` should be the package name of the MiniApp (for ex `miniapp-a` or `@company/cool-miniapp` for example)  
`[MINIAPP_DIRECTORY_NAME]` should be the associated directory name where the MiniApp has be cloned to in `ern-workspace` (for ex `MiniAppA`)

At this point our directory structure should be 

```
ern-workspace
├── .vscode
│   └── launch.json
├── MiniAppA
├── MiniAppC
├── node_modules
├── package.json
└── yarn.lock
```

The basic setup is now complete. If you need to add more MiniApps over time, just clone any additional MiniApps in the `ern-workspace` directory and make sure to `ern link` the new MiniApp and add a corresponding mapping entry to `sourceMapPathOverrides` configuration.

We can now start debugging with the help of the [ern start] command.

## Debbuging

You can now use [ern start] command as you are used to.  
The only thing that is required for this setup to work is for the Electrode Native Composite (generated as part of `ern start` command execution) to be generated in the `composite` directory in our `ern-workspace` directory. Assuming that the absolute path to `ern-workspace` directory is `/path/to/ern-workspace`, we can just use the `--compositeDir` option of `ern start` to achieve this, as follow :

```shell
$ ern start [options] --compositeDir /path/to/ern-workspace/composite
```

`[options]` are any other options that you might be using for `ern start` command, for example the MiniApps to include in the composite, or a cauldron descriptor to retrieve MiniApps from.

Once commnand execution is done, our final directory structure should look like :

```
ern-workspace
├── .vscode
│   └── launch.json
├── composite
├── MiniAppA
├── MiniAppC
├── node_modules
├── package.json
└── yarn.lock
```

You can now open the `ern-workspace` directory in Visual Studio Code (if not done already) and launch the native application (if it is not already launched or is not being launched automatically by `ern start` if you have a binary store configured). 

To attach Visual Studio Code to the React Native debugger (first make sure that `ern start` command has completed and is still running in the background -i.e not killed-), you should run the `Attach to packager` debug configuration from Visual Studio Code. You will notice an indicator that will keep spinning until Visual Studio Code gets attached to the React Native debugger.

In the native application, bring up the React Native Developer Menu, and turn on JS Debugging by tapping the `Debug JS Remotely` button. This will result in attaching to the Visual Studio Code debugger (if debugging was already turned on in the native app, just retrigger the debugger by tapping `Stop Remote JS Debugging` and then `Debug JS Remotely`). In Visual Studio Code you should now see that the debugger was attached, and you should see the visual studio icons part of a debbugging session. We are now able to put breakpoints in `MiniAppA` and `MiniAppC` sources, and debug the MiniApps from Visual Studio Code.

[Visual Studio Code]: https://code.visualstudio.com/
[React Native Tools]: https://marketplace.visualstudio.com/items?itemName=msjsdiag.vscode-react-native
[ern start]: ../cli/start.md
[ern link]: ../cli/link.md
