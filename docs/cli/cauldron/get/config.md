## `ern cauldron get config <descriptor>`
#### Description
* Retrieve the configuration stored in the Cauldron for a given partial native application descriptor or complete native application descriptor
* Log the configuration as a JSON formatted string in your terminal  

#### Syntax
`ern cauldron get config <descriptor>`  

#### Remarks
* A Cauldron can contain global configurations that apply to:
  - All native application versions  
  - All versions of a given native application platform  
  - A specific native application version  
* Only the container generator configuration is stored in a Cauldron.
* Because container generation is platform-specific, this configuration is stored per-native-application platform and applies to all native application versions associated to the platform.  
* You can view the configuration in the Cauldron document stored in your Git repository.

____
