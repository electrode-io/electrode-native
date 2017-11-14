## `ern regen-api-impl`

#### Description

* Regenerate an existing API implementation located in the current working directory.

#### Syntax

`ern regen-api-impl`

**Options**

`--apiVersion/-v`

* Version of the api for which the implementation needs to be generated. If not passed, the latest available version of the api will be picked up.


`--hasConfig`

* Indicates if this api implementation requires some config during initialization. This command will be stored and reused during container generation to enforce config initialization

#### Remarks

* This command is used for example, if you add new requests to an api and would like to regenerate the implementation code for the same.
* This command will only regenerate the read-only files inside the implementation project to avoid overriding any local changes made to the request handler implementations.
* Once the command is executed, it may be required to fix any compilation issues in those files before publishing the code a git repo or npm.
* This command must be executed from within the root directory of an API implementation project that was initially created using the `ern create-api-impl` command.
