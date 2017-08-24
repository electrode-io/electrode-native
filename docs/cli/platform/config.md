**Gets or sets local platform config values**

This command can be used to get or set local platform config values stored in `~/.ern/.ernrc` file.  

You should never have to use this command, considering that all current config values are set and retrieved transparently through the use of some platform commands relying on local platfom configuration.

### Command

#### `ern platform config <key> [value]`

Get or set the `value` associated to a given `key` in the local platform configuration.
If no `value` is provided, the command will read the `value` associated with the given `key` and will log it in your terminal.
If a `value` is provided, the command will set the `value` associated with the given `key` with the given `value`, overwriting any existing `value` stored for this `key`.