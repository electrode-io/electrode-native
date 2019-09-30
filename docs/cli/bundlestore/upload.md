## `ern bundlestore upload`

**This command can only be used with access to an [Electrode Native bundle store server]**

**To use this command, the `bundleStore` config must be set in cauldron**

### Description

Upload a JS bundle to the current store.

### Remarks

- Both iOS and Android bundles will be generated and uploaded to the store by default. If you only need to upload a bundle for a single platform, use the `--platform` option.

- By default development bundle(s) will be generated. If you rather need to upload a production bundle you can use the `--prod` flag.

- There are three different ways to generate and upload a bundle :
  - Using a Cauldron, by providing a descriptor and eventually some extra JS dependencies (`--descriptor`/`--extraJsDependencies` option)
  - By manually specifying all the MiniApps/JS API Implementations and extra JS dependencies to put in the bundle (`--miniapps`/`--jsApiImpls`/`--extraJsDependencies` options)
  - From a metro server (packager) running locally (`--fromPackager` flag)

### Syntax

`ern bundlestore upload`

#### Options

`--baseComposite <compositePath>`

* Git or File System path, to the custom Composite repository (refer to the [custom Composite] documentation for more information).

`--descriptor/-d <descriptor>`

* Generate and upload a JS bundle out of all the MiniApps/JS API implementations associated to this *complete native application descriptor*.
* Mutually exclusive with `--miniapps`/`--jsApiImpls` options.

`--extraJsDependencies/-e <dependencies>`

* Add extra JavaScript dependencies to the JS bundle to upload.
* Can be used in combination with `--descriptor` or `--miniapps`/`--jsApiImpls` options.

`--fromPackager`

* Get and upload the bundle served by the current local metro server (packager).
* A metro server must be running on `localhost:8081` in order to use this flag.
* Mutually exclusive with `--descriptor`/`-miniapps`/`jsApiImpls`/`extraJsDependencies` options.

`--fromGitBranches`

* Create Composite using the latest commits made to each of the MiniApp branches (HEAD), rather than using the MiniApps SHAs that are inside the current Container version.  
* Can only be used in combination with the `--descriptor` option.
* This flag will be ignored if the target descriptor does not contain any MiniApps tracking git branches
**Default** false

`--jsApiImpls`

* One or more JS API implementation(s) to add to the JS Composite project.
* The  JS API implementation(s) passed to this command can be a valid Yarn package format or a Git format or file scheme.  
* Mutually exclusive with `--descriptor` option.

`--miniapps/-m <miniapps>`

* One or more MiniApps to add to the JS Composite project.
* The MiniApps passed to this command can be a valid Yarn package format or a Git format or file scheme.  
* Mutually exclusive with `--descriptor` option.

`--platform`

* Set this option to generate and upload bundle for a single platform.
* Either `android` or `ios`.
* If this option is not provided, both iOS and Android bundles will be generated and uploaded.

`--prod`

* Set this flag to geenrate and upload a production bundle.
* If this flag is not set, a development bundle will be generated and uploaded.

#### Related commands

[bundlestore create] | Create a store
[bundlestore use] | Use a specific store    
[bundlestore delete] | Delete a store

[bundlestore create]: ./create.md
[bundlestore delete]: ./delete.md
[bundlestore use]: ./use.md
[platform config set]: ../platform/config/set.md
[Electrode Native bundle store server]: https://github.com/electrode-io/ern-bundle-store
[custom Composite]: ../../platform-parts/composite/index.md