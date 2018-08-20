## `ern cauldron config set`

#### Description

Sets configuration stored in Cauldron.

#### Syntax

`ern cauldron config set`  

**Options**  

`--key`

* The configuration key for which to set configuration value
* **Default**  Will set the whole configuration object

`--descriptor`

* The target descriptor which to set configuration for  
**Default**  Set the top level / global configuration, not associated to a specific descriptor

`--value`

* Value to set
**There is not default, this is required**
* The value can either be a number, boolean, string or an object
* An object can be provided as a JSON string or as a file path to a JSON file, or finally as a reference to a JSON file stored in Cauldron (using the `cauldron://` file scheme)

#### Related commands

[ern cauldron config get] | Echoes configuration stored in Cauldron.  
[ern cauldron config del] | Deletes configuration stored in Cauldron.

_________
[ern cauldron config get]: ./get.md
[ern cauldron config del]: ./del.md