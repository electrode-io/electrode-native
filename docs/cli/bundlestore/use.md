## `ern bundlestore use`

**This command can only be used with access to an [Electrode Native bundle store server]**

**To use this command, the `bundleStore` config must be set in cauldron**
### Description

Set a store as the current target to upload bundles to

### Syntax

`ern bundlestore use <storeAccessKey>`

#### Arguments

`<storeAccessKey>`

The access key of the store to use.  
This is the key that was obtained when initially running the [bundlestore create] command for this store.

#### Remarks

Once a given store is in use :

- Whenever running an `ern` command, the name of the store currently in use will be displayed in the logs next to the current Cauldron name.

- The [bundlestore upload] command will upload bundles to this store. 

#### Example

- `ern bundlestore use d49fd6a7-4957-42df-953b-8ac3a98e7cf8`

Use the store associated to access key `d49fd6a7-4957-42df-953b-8ac3a98e7cf8`

*Output:*
```
ℹ Now using store mystore
```

#### Related commands

[bundlestore create] | Create a store  
[bundlestore delete] | Delete a store    
[bundlestore upload] | Upload a bundle to the current store

[bundlestore create]: ./create.md
[bundlestore delete]: ./delete.md
[bundlestore upload]: ./upload.md
[platform config set]: ../platform/config/set.md
[Electrode Native bundle store server]: https://github.com/electrode-io/ern-bundle-store