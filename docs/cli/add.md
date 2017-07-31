**Adds a package to a `MiniApp` and any package it depends on**

When working with a `MiniApp`, you should always use `ern add` to add packages to your `MiniApp` in place of `yarn add` or `npm install`

This command will ultimately run `yarn add` for you behind the scene, but it will perform additional compatibility checks beforehand.

You should not specify any explicit version for a package you add through `ern add`. If the package is declared in the current platform `manifest`, then the version from the manifest will be used.
If the package is not declared in the manifest, then additional checks will be performed to infer if the package contains native code in any way. If that's the case, `ern add` will deny install of the package until a configuration is added to the master manifest for this package. If the package contains only JS code, then `ern add` will proceed with package installation with no further checks.

### Commands

#### `ern add <dependency>`

This will add the dependency to the `MiniApp` package.json `dependencies`

#### `ern add <dependency> [--dev/-d]`

This will add the dependency to the `MiniApp` package.json `devDependencies`

#### `ern add <dependency> [--peer/-p]`

This will add the dpenedency to the `MiniApp` package.json `peerDependencies`