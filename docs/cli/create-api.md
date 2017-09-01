**Creates an API for Native <-> MiniApp communication**

This command can be used to create a new `API` project based on a `Swagger` schema.
The generated `API` project will contain the client code of the `API` for the three platforms (JS/Android/iOS) as well as any models and code to guide the implementation of the API.  

The generated `API` project is meant to be published to `npm`, that is why you'll notice that it contains a `package.json`. Once you have a version of your `API` ready, you should publish it to `npm` to make it available for people to use. Considering that the `API` is published on `npm`, you should make sure before generating the `API` that the name is not already used by another `API`, otherwise you won't be able to publish it (Nota: we should probably check this check at the platform level)

If you already have an existing `API` project and want to add new request(s)/event(s)/model(s) to its schema and regenerate it, you should instead use the `ern regen-api` command.

Once you have created your `API`, you might eventually be interested in providing an implementation for it (either a native or JS implementation). If that is the case, you should check the associated `ern create-api-impl` command to kickstart an implementation project for a given `API`. 

### Command

#### `ern create-api <name>`

This will create a new `API` project with the given `name`.  

Please note that the `name` will not be used as such for the name of the project. Indeed, to follow `react-native` naming convention, the `API` project will be named as `react-native-{{{name}}}-api`.
For example, running `ern create-api weather` will create an `API` project named `react-native-weather-api`.  
The project will be generated in a new directory named after the complete `API` project name (i.e, reusing the previous example, the project will get generated in a new directory named `react-native-weather-api`)

#### `ern create-api <name> --scope/-s <scope>`

Use a given `npm scope` for this `API` project package.  

For example, running `ern create-api weather --scope MyCompany` will create a scoped package name as `@MyCompany/react-native-weather-api`.

#### `ern create-api <name> --version/-v <version>`

Use a specific initial `version` for this API. 
If not provided, the intial `version` of the API will default to `0.0.1`.

#### `ern create-api <name> --author/-a <author>`

Set the `author` of this API (in the `package.json` of the API).  
If not provided, the author will not be set.

#### `ern create-api <name> --schemaPath/-p <schemaPath>`

Generate this `API` using a pre-existing `Swagger` schema located at the given `schemaPath`.  
If not provided, the command will use a default starter schema to generate the initial `API`, that you can modify at your convenience to create your `API` and then regenerate the `API` using `ern regen-api` command.