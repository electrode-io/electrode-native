**Regenerates an existing API project**

This commnand can be use to regenerate an `API` following a `Swagger` schema update, for example if you add new `requests`/`events` or `models` to the schema, you might want to regenerate the existing `API` based on this schema update and publish a new version of it.

This command needs to be executed from withing the root directory of an `API` project that was initially created using `ern create-api`.

### Command

#### `ern regen-api`

Will regenerate the `API` located in the current working directory, based on the updated `Swagger` schema.