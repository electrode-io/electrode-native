## Upgrading Electrode React Native platform

### Platform versioning

`Electrode React Native `project currently follow a `2 weeks release lifecycle`.  

This means that every 2 weeks (on `Mondays`) a new version of the platform will be released.  

Following `React Native` versioning, the new platform version will see its `minor` version digit bumped (i.e `0.5.0`, `0.6.0`, `0.7.0`, etc...).

In between two `main` releases, we might also publish some `maintenance releases`. These releases will be identified as a `patch` version bump (i.e `0.5.1`, `0.5.2`, etc..). These specific releases will be meant to fix any potential ajor `blocking` bug, impacting multiple users, with no workaround (in that case, we don't really want users to wait 2 weeks to get this kind of issue fixed). 

### Upgrading to a new platform version

Upgrading the platform is actually quite easy. That being said, before upgrading to a new platform version, you should always ensure to get aware of the `release notes`(url) of this new version. Indeed, while we will do our best to remtain backward compatibility as much as possible, some new versions might contain `breaking changes` that could impact your current workflow. 

`Electrode React Native` contains a built platform version management system (somehow similar to what [nvm](https://github.com/creationix/nvm) is for `Node.js`) , which allows you to keep multiple versions of the platform installed locally. Of course, only one version of the platform can be active at any given time, but this actually allows for easy rollbacking to previous platform versions or to actually switch back to an older version for some use cases. When we are talking about `upgrading` your version of `Electrode React Native`, it actually does not mean `overwriting` an older version with a new one, but instead, actually install the latest version of `Electrode React Native` and activating it.  

Installing and switching to a specific version of `Electrode React Native` can be done through the `ern platform use` command. Check it out for more details. The platform also offers a few additional commands to manage platform versions : `ern platform install`, `ern platform uninstall` and `ern platform list`  to install or uninstall a specific version, or list all currently available platform versions (highlihgting the ones that are installed locally as well as the currently activated one).