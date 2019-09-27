## `ern platform config set`

#### Description

* Set the local platform configuration values stored in the `~/.ern/.ernrc` file  

#### Syntax

`ern platform config set <key> <value>`

**Arguments**

`<key>`

* The key of the configuration element to set

`<value>`

* If specified, will set the config value associated to this key. 

**Configurable properties**

- `codePushAccessKey` [string]   
Code push access key associated with your account 

- `codePushCustomHeaders`
CodePush custom extra http headers.

- `codePushCustomServerUrl` [string]  
CodePush custom server url, in case you are not using the Microsoft CodePush server.  

- `codePushProxy`
CodePush proxy server url.

- `ignore-required-ern-version` [boolean]
Indicates whether any Cauldron ern version requirement should be ignored.
This is mostly used for Electrode Native development and should not be set to true otherwise.
**default** : false

- `logLevel` [trace|debug|info|error|fatal]  
Set the log level to use for all commands.  
**default** : info

- `max-package-cache-size` [number]
The maximum disk space to use for the package cache, in Bytes.  
Only apply if the package cache is enabled (`package-cache-enabled` configuration key set to `true`).
**default** : 2GB

- `package-cache-enabled` [boolean]
Indicates whether the package cache should be enabled.  
Enabling the package cache will lead to faster Containers generation, given that all packages versions used for a Container generation, will be retrieved from the cache if available rather than being downloaded upon every generation.
**default** : true  

- `retain-tmp-dir` [boolean]   
If set to `true`, the temporary directories created during some commands execution, won't be destroyed after the command execution.  
**default** : false

- `showBanner` [boolean]  
Show the Electrode Native ASCII banner for all commands.  
**default** : true

- `tmp-dir`  
Temporary directory to use during commands execution.  
**default** : system default

#### Remarks
 
* In case a value already exists in the configuration for a given key, this command will not fail and will overwrite the existing value.

[Electrode Native bundle store server]: https://github.com/electrode-io/ern-bundle-store