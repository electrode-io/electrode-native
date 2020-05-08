## `ern cauldron why`

#### Description

- Why is a dependency (native or JS) in the Container of a native application version
- Logs a formatted dependency tree

#### Syntax

`ern why <dependency>`

**Arguments**

`<dependency>`

- The name of the native dependency

**Options**

`-d/--descriptor <descriptor>`

- The target native application version in the Cauldron (in the form of a complete native application descriptor) in which to look for this dependency.
  **Default** Lists all non-released native application versions from the Cauldron to choose from.
