## `command name`
#### Description

* <Action>...

#### Syntax
`command syntax`

**Options**

`--option name`

* description
<br><br>
**Default**  default description
<br>Example: example if available

`--option name`

* description

* description
<br><br>
**Default**  default description


#### Remarks
* remark 1
* remark 2


#### Related commands
 `command name` | description

#### Examples
(Add example code text here if applicable)

-------


**Adds a package/dependency to a `MiniApp` and any package it depends on**

When working with a `MiniApp`, you should always use `ern add` to add packages to your `MiniApp` in place of `yarn add` or `npm install`.

This command will run `yarn add` for you under the hood, but it will perform important additional compatibility checks beforehand. 

You should not specify any explicit version for a package you add through `ern add`. It will be ignored anyway.  
If the package is declared in the current platform `manifest`, then the version from the `manifest` will be used.  
The checks performed by this command are as follow :  
- If the package is declared in the manifest, then `ern` will install the package at the version declared in the manifest.
- If the package is not declared in the manifest, then additional checks will be performed :
  - If the package contains native code in any way (the package itself is a native module or it transitively contains one or more native dependency(ies)), the command will deny installation of the package until a configuration is added to the `manifest` for this package. 
  - If the package contains only JS code, then the command will proceed with package installation with no further checks.

### Command

#### `ern add <dependency>`

Given that all checks are passing, this will add the dependency to the `MiniApp` package.json `dependencies`

#### `ern add <dependency> [--dev/-d]`

This will add the dependency to the `MiniApp` package.json `devDependencies`  
No checks are currently performed to add development dependencies.

#### `ern add <dependency> [--peer/-p]`

This will add the dpenedency to the `MiniApp` package.json `peerDependencies`  
No checks are currently performed to add peer dependencies.

### Remarks

This command is the `ern` equivalent of `yarn add` / `npm install`