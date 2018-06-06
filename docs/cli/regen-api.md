## `ern regen-api`

#### Description

* Regenerate an existing API located in the current working directory, following a Swagger schema update  

#### Syntax

`ern regen-api`  

**Options** 

`--skipVersion/-s`
* Skip the step to update api version and publish to NPM.

`--bridgeVersion/-b`
* Specify version of the [Electrode Native Bridge] to use.
* Target `--bridgeVersion` can be found using `yarn info react-native-electrode-bridge versions`

#### Remarks

* This command is used for example, if you add new requests, events, or models to the schema and you want to regenerate the existing API based on this schema update and publish a new version of it.  
* This command must be executed from within the root directory of an API project that was initially created using the `ern create-api` command.  

#### Related commands

[ern create-api] | Create a new API project based on a Swagger schema  
[ern create-api-impl] | Create an implementation skeleton project for a specified API  

[Electrode Native Bridge]: https://github.com/electrode-io/react-native-electrode-bridge/releases
[ern create-api]: ./create-api.md
[ern create-api-impl]: ./create-api-impl.md
