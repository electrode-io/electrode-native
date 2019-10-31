## `ern link enable`

#### Description

* Enable a package link

#### Syntax

`ern link enable [packageName]`

#### Examples

- `ern link enable`

Enable the link associated to the package present in current directory

- `ern link enable foo`

Enable the link associated to the `foo` package

#### Caveats

The [ern start] command needs to be relaunched for any link(s) changes to take effect

#### Related commands

[ern link disable] | Disable a package link

[ern start]: ../start.md
[ern link disable]: ./disable.md
