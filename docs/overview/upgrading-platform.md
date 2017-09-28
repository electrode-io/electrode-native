## Upgrading Electrode Native

This section describes how to upgrade and activate a new version of Electrode Native.

### Platform versioning

A new version of Electrode Native is released every two weeks on Monday.

**Main releases**  
We bump the minor version for each of these releases, for example, `0.5.0`, `0.6.0`, `0.7.0`, etc..

**Maintenance releases**  
Maintenance releases may be released between two main releases. A maintenance release will be identified by a patch version bump, for example: `0.5.1`, `0.5.2`, etc.

The intent of a maintenance release is to fix major bugs, with no workaround, that may impact multiple users. A maintenance release helps users so that they don't need to wait for the next main release.

### Upgrading to a new platform version

Upgrading the platform is actually quite easy, its just a matter of running an `ern` command.  
That being said, before upgrading to a new platform version, you should always read the `release notes`(url) of this new version.

Indeed, while we will do our best to retain backward compatibility, some new versions might contain `breaking changes` that could impact your current workflow.

#### Before you upgrade

When you upgrade to a newer version of Electrode Native, previous installed versions of Electrode Native remain on your system; an upgrade does not overwrite the older versions.

Before you upgrade to a newer version of Electrode Native, read through the following upgrade guidelines: 

* Be sure to read the Release Notes for the new version.  
* An upgrade is usually backward compatible although backwards compatibility with every release is not guaranteed. Check to see if upgrading will impact your current workflow.
* Electrode Native contains a built-in platform version management system--similar to what [nvm](https://github.com/creationix/nvm) uses for `Node.js`--which allows you to keep multiple versions of the platform installed on your local system. The system allows you to easy rollback to a previous platform version or to actually switch back to an older version for some use cases.  
* Only one version of the platform can be active at any given time.   

#### To install and switch to a specific version of Electrode Native

* Use the `ern platform use` command to install and switch to a specific version.

###Related commands
`ern platform install` | Used to install a specific version
`ern platform uninstall` | Used to uninstall a specific version
`ern platform list` | Used to list all currently available platform versions. Versions that are installed locally and the active version are highlighted.