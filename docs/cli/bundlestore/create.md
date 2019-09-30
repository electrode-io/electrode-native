## `ern bundlestore create`

**This command can only be used with access to an [Electrode Native bundle store server]**

**To use this command, the `bundleStore` config must be set in cauldron**

### Description

Create a new store in the bundle store server

### Syntax

`ern bundlestore create <storeName>`

#### Arguments

`<storeName>`

The name of the store to create. 
This name is also used as a unique identifier for the store, therefore the command will fail in case a store with a similar name already exist in the bundle store server.

#### Remarks

Upon successful completion of this command :

- The current store will be set to this store (i.e any subsequent `bundlestore` commands will target this store). It is possible at any time to switch to a different store, using the [bundlestore use] command.

- The `store access key` will be logged. This key should be shared with users that will upload bundles to the store. The [bundlestore use] and [bundlestore delete] commands need this access key to operate.

#### Example

- `ern bundlestore create mystore`

Creates a new store with name `mystore`

*Output:*
```
ℹ Store mystore was successfuly created
ℹ AccessKey : d49fd6a7-4957-42df-953b-8ac3a98e7cf8
```

#### Related commands

[bundlestore use] | Use a specific store  
[bundlestore delete] | Delete a store  
[bundlestore upload] | Upload a bundle to the current store

[bundlestore use]: ./use.md
[bundlestore delete]: ./delete.md
[bundlestore upload]: ./upload.md
[platform config set]: ../platform/config/set.md
[Electrode Native bundle store server]: https://github.com/electrode-io/ern-bundle-store