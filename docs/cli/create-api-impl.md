**Creates an API implementation for Native <-> MiniApp communication**

This command can be used to kickstart the native or JS implementation of an `API`, by generating a skeleton project. You can then just fill in the gaps with your implementation !

You might or might not be the author of the `API` that you are planning to implement, but in any case a pre-requisite of generating an `API` implementation is to have an `API` to create an implementation for.  

If you haven't created an `API` yet, you'll need to do that first before jumping into implementation. You can create an `API` using the `ern create-api` command.

### Command

#### `ern create-api-impl <api>` 

This will create an implementation skeleton project for the given API.

The name of the implementation will mirror the name of the `api` package, with the `-impl` suffix added to it.  
For example, `ern create-api-impl react-native-weather-api`, will generate an implementation project named `react-native-weather-api-impl`.
Running this command without specifying a platform (native v.s js in the case of this command), will prompt for platform selection.

#### `ern create-api-impl <api> --nativeOnly/-n`

Will generate an implementation skeleton project for a native implementation of the `api`.

#### `ern create-api-impl <api> --jsOnly/-j`

Will generate an implementation skeleton project for a JavaScript implementation of the `api`

#### `ern create-api-impl <api> --outputDirectory/-o <directory>`

Generate the project in a specific provided output `directory`. 
By default, the project will be generated in a new directory, named as the `api` implementation project, and created at the location the command is run from.

#### `ern create-api-impl <api> --force/-f`

Force creation of the `api` implementation project, even if there is already an implementation project in the target directory (it will overwrite it completely).  
Use this flag only if you know what you're doing.