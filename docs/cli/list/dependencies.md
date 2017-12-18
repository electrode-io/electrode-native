## `ern list dependencies`

#### Description

* Lists the native dependencies of an Electrode Native module

#### Syntax

`ern list dependencies [module]`

**Arguments**

`[module]`

* The path to the module for which to list native dependencies. Can be any package descriptor supported by `yarn add`. If not specified, the command will assume that it is being run from withing the module folder.

#### Example

```shell
$ ern list dependencies movielistminiapp@0.0.9

[v0.11.0] [Cauldron: -NONE-]

Native dependencies :
=== APIs ===
react-native-ernmovie-api@0.0.9
react-native-ernnavigation-api@0.0.4
=== Third party declared in Manifest ===
react-native@0.51.0
react-native-electrode-bridge@1.5.9
```

#### Remarks

* This command will only list native dependencies.
