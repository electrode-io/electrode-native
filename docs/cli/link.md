**Links a given MiniApp directory**

This command can be of great use during development of your `MiniApp(s)` if you're looking for a way to develop/debug and even use react-native `hot reload` feature for your `MiniApp(s)` when it is run inside a host application, along with other `MiniApp(s)`.   

The issue in this scenario is that, because multiple `MiniApp(s)` are running together in the native application, you cannot just use `react-native start` from within your `MiniApp` folder and load the `bundle` from the local react-native packager as you would usually do when running your MiniApp standalone in the runner.

Indeed, using the local packager just for your `MiniApp` will make the native application crash (or display react-native red screen) whenever it will try to load another `MiniApp`, due to the fact that it won't find the other `MiniApp` in your own `MiniApp` bundle served through the local packager.  

Also even if running a single `MiniApp`, react-native packager does not play well with symbolic links. 

For all these reasons, we had to introduce a dedicated command to help with developping/debugging `MiniApp(s)` when running them inside a target native host application.

`ern link` / `ern unlink` and `ern start` are used together to achieve this.

### Command 

#### `ern link`

This command needs to be executed within a `MiniApp` working directory. It will `link` the `MiniApp` so that any changes to the code of the `MiniApp`, inside its working directory will be available in the native host application through a manual react-native reload of the `MiniApp` or through the `live/hot reload` feature of react-native.

After running `ern link`, the linking of the `MiniApp` will remain in effect until you `unlink` it through `ern unlink` command.

The `MiniApp(s)` links will only be used when you use the `ern start` command. This command will actually create a composite bundle with all the `MiniApp(s)` contained within the native application and will start the react-native packager for this bundle.

### Caeveats

This command is still an **experimental** command. We are actively working on making it better, but as of now it comes with some important limitations that you should be aware of. 

First, due to the current simple watching mecanism used by this command, the working directory of the `MiniApp` should contain the exact same code and the exact same dependencies as the `MiniApp` that is going to be retrieved by the `ern start` command.

Secondly, if you want to add any JS dependency to your `MiniApp` or change a JS dependency version, you'll need to relaunch the bundling from the start after adding/updating the dependencies, through `ern start` command.