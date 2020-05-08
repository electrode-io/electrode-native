## `ern create-plugin-config`

#### Description

* Automatically generates the Manifest configuration of a given React Native plugin

#### Syntax

`ern create-plugin-config <plugin>`

**Arguments**

`<plugin>`

* The npm package name of the React Native plugin for which to generate configuration. If no version is specified, latest will be considered. 

#### Examples

`ern create-plugin-config react-native-example-plugin`

Creates a plugin configuration for `react-native-example-plugin` latest version

`ern create-plugin-config react-native-example-plugin@1.2.0`

Creates a plugin configuration for `react-native-example-plugin` version `1.2.0`

#### Remarks

* This command needs to be run from the root of a cloned Manifest repository
* This command only creates the configuration in the manifest locally. You will need to manually review/test and then git add/commit/push the changes to the Manifest repository. 
*  This command will fail in case it detects that the plugin should be configurable as it doesn't support Configurable Plugin config generation.
