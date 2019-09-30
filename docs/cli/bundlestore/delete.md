## `ern bundlestore delete`

**This command can only be used with access to an [Electrode Native bundle store server]**

**To use this command, the `bundleStore` config must be set in cauldron**

### Description

Delete an existing store from the bundle store server

### Syntax

`ern bundlestore delete <storeAccessKey>`

#### Arguments

`<storeAccessKey>`

The access key of the store to delete from the server.  
This is the key that was obtained when initially running the [bundlestore create] command for this store.

#### Example

- `ern bundlestore delete d49fd6a7-4957-42df-953b-8ac3a98e7cf8`

Delete the store associated to access key `d49fd6a7-4957-42df-953b-8ac3a98e7cf8`

*Output:*
```
ℹ Deleted store mystore
```

#### Related commands

[bundlestore create] | Create a store  
[bundlestore use] | Use a store     
[bundlestore upload] | Upload a bundle to the current store

[bundlestore create]: ./create.md
[bundlestore use]: ./use.md
[bundlestore upload]: ./upload.md
[platform config set]: ../platform/config/set.md
[Electrode Native bundle store server]: https://github.com/electrode-io/ern-bundle-store