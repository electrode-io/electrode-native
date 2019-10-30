## `ern link add`

#### Description

* Add a package link

The `ern link add` command is helpful during development of your MiniApps as a way to develop and debug your application. The command is also helpful as a way to use the react-native hot reload feature for your MiniApps when the command is run inside a host application along with other MiniApps.   

The `ern link add` command was developed to help with developing and debugging MiniApps when running them inside a target native host application. This benefit is realized in the following scenario: When you run multiple MiniApps together in the native application, you cannot use the `react-native start` command from within your MiniApp directory and load the bundle from the local react-native packager as you would normally do when running your MiniApp standalone in the runner.

Using the local packager for your MiniApp makes the native application fail whenever it attempts to load another MiniApp—due to the fact that it doesn't find the other MiniApps in your own MiniApp bundle served through the local packager. And, if running a single MiniApp, the react-native packager does not function well with symbolic links.

In response to this scenario, you can use the `ern link add` command to help with developing and debugging MiniApps when running them inside a target native host application.

The `ern link add` or the [ern link rm] plus the [ern start] commands are used together to achieve this.

#### Syntax

`ern link add`  

#### Caveats

1) If you add a JavaScript dependency to your MiniApp (through `ern add`) or update a JavaScript dependency version, you'll have to relaunch the `ern start` command.

#### Remarks

* This command must be executed within a directory containing a node project (i.e directory with a package.json)
* Any changes to the code of the MiniApp, inside its working directory, are available in the native host application through a manual react-native reload of the MiniApp or through the live/hot reload feature of react-native.  
* After running the `ern link add` command, the link to the MiniApp directory remains in effect until you unlink it using the [ern link rm] command.  
* The MiniApps link is used when you use the [ern start] command. This command creates a composite bundle with all the MiniApps contained within the native application and starts the react-native packager for this bundle.

#### Related commands

[ern link rm] | Remove a package link

[ern start]: ../start.md
[ern link rm]: ./rm.md
