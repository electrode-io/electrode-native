## `ern regen-api`

#### Description

* Regenerate an existing API located in the current working directory, following a Swagger schema update  

#### Syntax

`ern regen-api`  

**Options** 
`--skipVersion/-s`
* Skip the step to update api version and publish to NPM.

`--bridgeVersion/-b`
* Version of the [Electrode Native Bridge] to use.

#### Remarks

* This command is used for example, if you add new requests, events, or models to the schema and you want to regenerate the existing API based on this schema update and publish a new version of it.  
* This command must be executed from within the root directory of an API project that was initially created using the `ern create-api` command.  

[Electrode Native Bridge]: https://github.com/electrode-io/react-native-electrode-bridge
