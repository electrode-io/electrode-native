## `ern cauldron update file`

#### Description

- Update an existing file in the Cauldron

#### Syntax

`ern cauldron update file <localFilePath> <cauldronFilePath>`

**Arguments**

`<localFilePath>`

- Absolute path to a file to overwrite Cauldron target file with

`<cauldronFilePath>`

- Target file path in the Cauldron, of the file to update (overwrite)
- Relative to the root of the Cauldron repository
- Should include target file name (can be same as source filename or different)
- Source file name can be different
- The file referenced by the path should exist in the Cauldron

#### Examples

- `ern cauldron update file /etc/example.json data/example.json`  
  Overwrite file `example.json` in the Cauldron directory `data`, with the file `example.json` located in local path `/etc`

#### Related commands

[ern cauldron add file] | Add a file to the Cauldron  
[ern cauldron del file] | Remove a file from the Cauldron

---

[ern cauldron add file]: ../add/file.md
[ern cauldron del file]: ../del/file.md
