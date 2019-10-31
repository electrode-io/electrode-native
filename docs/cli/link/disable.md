## `ern link disable`

#### Description

* Disable a package link

#### Syntax

`ern link disable [packageName]`

#### Examples

- `ern link disable`

Disable the link associated to the package present in current directory

- `ern link disable foo`

Disable the link associated to the `foo` package

#### Caveats

The [ern start] command needs to be relaunched for any link(s) changes to take effect

#### Related commands

[ern link enable] | Enable a package link

[ern start]: ../start.md
[ern link enable]: ./enable.md
