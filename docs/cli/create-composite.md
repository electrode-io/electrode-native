## `ern create-composite`

#### Description

- Create a JS Composite project locally.

#### Syntax

`ern create-composite`

**Options**

`--baseComposite <compositePath>`

- Git or File System path, to the custom Composite repository (refer to the [custom Composite] documentation for more information).

`--descriptor/-d <descriptor>`

- Create a new JS Composite including all the MiniApps listed in the Cauldron for the given _complete native application descriptor_

`--extraJsDependencies/-e <dependencies>`

- Add extra JavaScript dependencies to the JS Composite project.

`--fromGitBranches`

- Create Composite using the latest commits made to each of the MiniApp branches (HEAD), rather than using the MiniApps SHAs that are inside the current Container version.
- This flag is only used when creating a Composite from a Cauldron descriptor
- This flag will be ignored if the target descriptor does not contain any MiniApps tracking git branches
  **Default** false

`--jsApiImpls`

- One or more JS API implementation(s) to add to the JS Composite project.
- The JS API implementation(s) passed to this command can be a valid Yarn package format or a Git format or file scheme.
- This option can only be used if the `--descriptor` option is not used.

`--miniapps/-m <miniapps>`

- One or more MiniApps to add to the JS Composite project.
- The MiniApps passed to this command can be a valid Yarn package format or a Git format or file scheme.
- This option can only be used if the `--descriptor` option is not used.

`--outDir/--out <directory>`

- Specify the directory to output the generated JS Composite project to
- The output directory should either not exist (it will be created) or be empty
- **Default** If this option is not provided, the Composite is generated in the default platform directory `~/.ern/containergen/miniAppsComposite`.

#### Related commands

[ern create-container] | Creates a Container locally

[ern create-container]: ./create-container.md
[custom composite]: ./platform-parts/composite/index.md
