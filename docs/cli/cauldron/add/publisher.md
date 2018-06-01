## `ern cauldron add publisher`

### Description

* Add a Container publisher for a given native application to automatically publish generated Containers to a remote location.
* A native application can have more than one Container publisher.
* If a native application has no publishers, Containers of this application will not be published anywhere (will just be generated locally).
* Check the specific Container publisher documentation as it contains reference on how to use this command with it.

#### Syntax

**Options**

`--publisher/-p`

* The Container publisher to add

`--url/-u`

* The url to publish the Container to 
* Some publishers might not need an url. Check the specific Container publisher documentation for reference

`--descriptor/-d`

* Partial native application descriptor (without version)
* If ommitted, the command will prompt interactively

`--config/c`

* Extra configuration specific to the publisher used.
* Some publishers might not need an extra configuration. Check the Container publisher documentation for reference.

#### Remarks

* The `ern cauldron add publisher` command is mostly used during the initial setup of cauldron.
* You can create your own Container publisher if you need to !

