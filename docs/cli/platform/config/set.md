## `ern platform config set`

#### Description

* Set the local platform configuration values stored in the `~/.ern/.ernrc` file  

#### Syntax

`ern platform config set <key> [value]`

**Arguments**

`<key>`

* The key of the configuration element to set

`[value]`

* If specified, will set the config value associated to this key. If not specified, will retrieve the config value (get) associated to this key.

**Configurable properties**

- `logLevel` [trace|debug|info|error|fatal]  
Set the log level to use for all commands.  
**default** : info

- `showBanner` [true|false]  
Show the Electrode Native ASCII banner for all commands.  
**default** : true

- `tmp-dir`  
Temporary directory to use during commands execution.  
**default** : system default

- `retain-tmp-dir` [true|false]   
If set to `true`, the temporary directories created during some commands execution, won't be destroyed after the command execution.  
**default** : false

- `codePushAccessKey` [string]   
Code push access key associated with your account  

#### Remarks

* The `ern platform config set <key> [value]` command is rarely used.  
* All current configuration values are already set and retrieved transparently through the use of commands that rely on the local platform configuration.  
* If a value is provided, the `ern platform config set <key> [value]` command sets the value associated with the given key with the specified value, overwriting any existing value stored for this key.