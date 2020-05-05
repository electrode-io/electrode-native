## `ern cauldron config get`

#### Description

Echoes configuration stored in Cauldron.

#### Syntax

`ern cauldron config get`  

**Options**  

`--key`

* The configuration key for which to retrieve value
* **Default**  Will return the whole configuration object

`--descriptor`

* The target descriptor which to retrieve configuration from  
**Default**  Returns the top level / global configuration, not associated to a specific descriptor

`--json`

* Output config as a single line JSON record.

`--strict`

* Echoes the configuration strictly associated to the descriptor  
**Default**  false. If no configuration is found for the specific descriptor, the closest applied configuration will be returned. For example, if a native application version descriptor is provided but no configuration is stored at this level, the command will look for a configuration -until it finds one- in the platform level, then native application and finally top level / global cauldron config.

#### Related commands

[ern cauldron config set] | Sets configuration stored in Cauldron.  
[ern cauldron config del] | Deletes configuration stored in Cauldron.

_________
[ern cauldron config set]: ./set.md
[ern cauldron config del]: ./del.md
