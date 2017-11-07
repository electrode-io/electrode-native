## `ern create-api`

#### Description

* Create a new API project based on a Swagger schema  

#### Syntax

`ern create-api <apiName>`  

**Arguments**

`<apiName>`

* The name to use for this API. The API name must only contain upper and/or lower case letters.

**Options**  

`--scope/-s <scope>`

* Specify a given npm scope for the API project package  
* Add the package scope automatically in the `package.json` of the generated API.
* **Default** Package will be unscoped.

`--packageName/-p <name>`

* Specify the NPM package name to use for the API.
* Add the package name automatically in the `package.json` of the generated API.
* **Default** The command will prompt for the package name to use.

`--apiVersion/-a <version>`

* Specify an initial version for the API  
* **Default**  If this option is not used, the API defaults to 0.0.1.  

`--apiAuthor/-u <author>`

* Specify the author of the API in the `package.json` file of the API  
* **Default**  If this option is not used, the author is not set.  

`--schemaPath/-m <schemaPath>`

* Generate the API using a pre-existing Swagger schema located at the given `schemaPath`  
* **Default**  If this option is not used the command uses a default starter schema to generate the initial API. You can modify this option at a later time and then regenerate the API using the `ern regen-api` command.  

`--skipNpmCheck`
* Skip the check ensuring package does not already exists in NPM registry
* **Default** The value defaults to false. 

#### Examples

`ern create-api weather`  
This example shows how to create a unscoped package named `weather-api`. The API project is located in the new directory named `weather`.   

`ern create-api weather --scope MyCompany`  
This example shows how to create a scoped package named `@MyCompany/weather-api`.  

#### Remarks


* The generated API project contains the API client-code for the three platforms (JavaScript, Android, and iOS) as well as any models and code to guide the implementation of the API.  
* The generated API project is meant to be published to npm and it contains the `package.json` file.  
* Once you have a version of your API ready, you should publish it to npm to make it available for people to use. Considering that the API is published to npm, you should make sure before generating the API, that the name is not already used by another API otherwise you won't be able to publish an API with a duplicate name.  
* The API project is created in a new directory named after the API project name.  

#### Related commands

[ern regen-api] | Add a new request, event, or model to an existing API project schema and regenerate the API  
[ern create-api-impl] | Create an implementation skeleton project for a specified API

[ern regen-api]: ./regen-api.md
[ern create-api-impl]: ./create-api-impl.md