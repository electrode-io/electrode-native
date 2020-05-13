## `ern cauldron add file`

#### Description

- Add a file to the Cauldron

#### Syntax

`ern cauldron add file <localFilePath> <cauldronFilePath>`

**Arguments**

`<localFilePath>`

- Absolute path to a file to add to the Cauldron

`<cauldronFilePath>`

- Target file path in the Cauldron
- Relative to the root of the Cauldron repository
- Cannot start with `/`
- Should include target file name (can be same as source filename or different)
- Can contain nested directories
- All directories will be created in the Cauldron if necessary.

#### Examples

- `ern cauldron add file /etc/example.json data/example.json`  
  Add the file `example.json` from local directory `/etc` to the `data` directory of the Cauldron.

- `ern cauldron add file /etc/example.json data/new.json`  
  Add the file `example.json` from local directory `/etc` to the `data` directory of the Cauldron. Rename the file to `new.json` in the Cauldron.

#### Related commands

[ern cauldron update file] | Update a file in the Cauldron  
[ern cauldron del file] | Remove a file from the Cauldron

---

[ern cauldron update file]: ../update/file.md
[ern cauldron del file]: ../del/file.md
