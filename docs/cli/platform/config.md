## `ern platform config`

#### Description

* Get or set the local platform configuration values stored in the `~/.ern/.ernrc` file  

#### Syntax

`ern platform config <key> [value]`

**Arguments**

`<key>`

* The key of the configuration element to get or set

`[value]`

* If specified, will set the config value associated to this key. If not specified, will retrieve the config value (get) associated to this key.

**Configurable properties**

- `logLevel` [trace|debug|warn|info|fatal]  
Set the log level to use for all commands.  
By default, commands log level is set to `info`.

- `showBanner` [true|false]  
Show the Electrode Native ASCII banner for all commands.  
By default, the value is set to `true` (banner is shown).

#### Remarks

* The `ern platform config <key> [value]` command is rarely used.  
* All current configuration values are already set and retrieved transparently through the use of commands that rely on the local platform configuration.  
* If a value is not provided, the `ern platform config <key> [value]` command reads the value associated with the specified key and logs it in the terminal.  
* If a value is provided, the `ern platform config <key> [value]` command sets the value associated with the given key with the specified value, overwriting any existing value stored for this key.
