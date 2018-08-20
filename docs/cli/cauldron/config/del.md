## `ern cauldron config del`

#### Description

Deletes configuration stored in Cauldron.

#### Syntax

`ern cauldron config del`  

**Options**  

`--key`

* The configuration key to delete
* **Default**  Will delete the whole configuration object

`--descriptor`

* The target descriptor which to delete configuration from  
**Default**  Deletes the top level / global configuration, not associated to a specific descriptor

#### Related commands

[ern cauldron config get] | Echoes configuration stored in Cauldron.  
[ern cauldron config set] | Sets configuration stored in Cauldron.

_________
[ern cauldron config get]: ./get.md
[ern cauldron config set]: ./set.md