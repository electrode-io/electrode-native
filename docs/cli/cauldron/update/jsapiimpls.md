## `ern cauldron update jsapiimpls`

#### Description

- Update one or more JS API implementation(s) version(s) in a non-released native application version in a Cauldron
- Generate and publish a new Container version

#### Syntax

`ern cauldron update jsapiimpls <jsapiimpls..>`

**Arguments**

`<jsapiimpls..>`

- One or more package path to JS API implementation(s) (delimited by spaces) to update in a target native application version in the Cauldron.
- The following types of JS API Implementation paths are not supported by this command :
  - File path (ex `file://etc/js-api-impl`)
  - Git path missing branch/tag or commit sha (ex: `https://github.com/username/js-api-impl.git`)
  - Registry path missing version (ex: `js-api-impl`)
  - Registry path using a version range (ex: `js-api-impl@^1.0.0`)

**Options**

`--containerVersion/-v <version>`

- Specify a version for the new container
- **Default** Incremental patch number of the current container version  
  Example: If the current container version is 1.2.3 and a version is not included in the command, the new container version will be 1.2.4.

`--descriptor/-d <descriptor>`

- You can only pass a complete native application descriptor as the JS API implementations updated using this command targets only a specific single native application version.  
  **Default** Lists all non-released native application versions from the Cauldron and prompts you to choose a descriptor.

`--resetCache`\

- Indicates whether to reset the React Native cache prior to bundling
- **Default** false
