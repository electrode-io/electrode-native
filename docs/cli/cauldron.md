**Batch multiple container state update operations**

This command allows to combine multiple Cauldron operations in a single execution.  

Due to the fact that a new `Container` is getting re-generated and published upon any `Cauldron` commands affecting the state of `Container`, it can be sometimes desired to combine multiple operations in a single batch so that `Container` is re-generated only once.

For example, if you'd like to update some dependencies versions in a `Container` while also adding new `MiniApps` to the container, without this command you would have to go through `ern cauldron update dependencies` and `ern cauldron add miniapps` commands, resulting in two operations and two `Container` generations.  

### Command

#### `ern cauldron --addDependencies <dependencies..>`  

Adds one or more native dependency(ies) version(s) to a target mobile application version `Container`

#### `ern cauldron --updateDependencies <dependencies..>`  

Updates the version(s) of one or more native dependency(ies) in a target mobile application version `Container`

#### `ern cauldron --delDependencies <dependencies..>`

Removes one or more native dependency(ies) from a target mobile application version `Container`

#### `ern cauldron --addMiniapps <miniapps..>`  

Adds one or more MiniApp(s) version(s) to a target mobile application version `Container`

#### `ern cauldron --updateMiniapps <miniapps..>`  

Updates the version(s) of one or more MiniApp(s) in a target mobile application version `Container`

#### `ern cauldron --delMiniapps <miniapps..>`

Removes one or more MiniApp(s) from a target mobile application version `Container`

### Remarks

This command performs the operations in the following order :

1) `delDependencies`
2) `delMiniapps`
3) `updateDependencies`
4) `updateMiniapps`
5) `addDependencies`
6) `addMiniapps`