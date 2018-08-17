## `ern cauldron update ernversion`

#### Description

* Update the Electrode Native version enforced by this Cauldron.
* Enforcing an Electrode Native is a good practice as it ensures that all clients of this Cauldron are using a similar Electrode Native version.
* Only enforces Electrode Native versions greater than or equal to 0.24.0

#### Syntax

`ern cauldron update ernversion`  

**Options**  

`--version`

* Specify the version of Electrode Native to be enforced for clients of this Cauldron. 
* Value can be set as **none** if you wish to disable Electrode Native version enforcement for this Cauldron (thus allowing clients using any version of Electrode Native to access this Cauldron).
* Only valid (available) Electrode Native versions are allowed.
* At this time, it is only possible to do a forward version update (for example if the current enforced version is 0.21.0, it is not possible to update enforcement to 0.20.0)
* **Default** Current Electrode Native version.

`--force`

* Force the Electrode Native version enforcement, even if the version is not an available, or if it is a lower than the currently enforced version.  
**Default**  false