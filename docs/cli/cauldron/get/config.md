**Get configuration from the Cauldron**

A `Cauldron` can hold some global configuration that apply either to all native application versions, or all the versions of a given native application platform, or just a single specific native application version.

As of now, the only configuration stored in a `Cauldron` is the `container generator` configuration. Because container generation is platform specific, this configuration is stored per native application platform and applies to all native application versions associated to this platform.

As an alternative to this command, you can directly take a look in the `Cauldron` document stored in your git repository to see the configuration (going directly to the repository is actually the only way to set the configuration as we don't offer as of now any command to actually set the configuration).

### Command

#### `ern cauldron get config <descriptor>`

Retrieves the configuration stored in the `Cauldron` for a given `partial or complete native application descriptor`, and log it as a JSON formatted string in your terminal.

