## `ern cauldron add publisher`

### Description

* Add a Container publisher for a given native application to automatically publish generated Containers to a remote location.
* A native application can have more than one Container publisher (for example you might want to publish you Containers to a Git repository, as well as a Maven repository)
* If a native application has no publishers, Containers of this application will not be published anywhere (will just be generated locally).
* Check the specific Container publisher documentation as it contains reference on how to use this command with it.
* You can create/distribute your own custom custom Container publisher if needed.

### Currently Available Official Publishers

- [git](https://github.com/electrode-io/ern-container-publisher-maven)  
To publish Android and iOS Electrode Native Containers to a remote git repository. The git repository provider does not matter (GitHub, BitBucket, TFS ...).

- [maven](https://github.com/electrode-io/ern-container-publisher-maven)  
To publish Android Electrode Native Containers to a local or remote Maven repository.

- [jcenter](https://github.com/electrode-io/ern-container-publisher-jcenter)  
To publish Android Electrode Native Containers to a remote JCenter repository.

- [dummy](https://github.com/electrode-io/ern-container-publisher-dummy)  
This publisher is mostly used for testing and as starter simple publisher reference to create your own. It does not actually publish the Containers anywhere.

### Syntax

**Options**

`--publisher/-p`

* The name of the Container publisher to add (for ex `git`)
* Can also include a specific version or a version range (for ex `git@1.0.0` or `git@^1.0.0`)
* If no version is specified, the latest available version of the publisher will be used at the time of publication (this is a bit risky given that new major publisher versions will contain breaking changes. We **recommend** that you use a specific version or version range allowing minor and patch updates only)
* This option is required, there is no default.

`--url/-u`

* The url to publish the Container to
* Some publishers might not need an url. Check the specific Container publisher documentation for reference

`--descriptor/-d`

* Partial native application descriptor (without version) corresponding to a specific native application / platform couple (for example `MyNativeApp:android`) for which to add the publisher to.
* If ommitted, the command will prompt interactively to select a native application and platform couple from the Cauldron

`--extra/-e`

* Extra configuration specific to the publisher (as json)
* Some publishers might not need any extra configuration. Check the specific Container publisher documentation for reference.
* There is three different ways to provide the json extra configuration :
  - **As a json string**  
  For example `--extra '{"configKey": "configValue"}'`  
  In that case, the configuration will be added to the Cauldron main document.  
  - **As a file path**  
  For example `--extra /Users/username/my-publisher-config.json`  
  In that case, the configuration will be read from the file and will be added to the Cauldron main document.
  - **As a Cauldron file path**  
  For example `--extra cauldron://config/publishers/my-publisher-config.json`  
  In that case, the configuration will not be added to the Cauldron main document, but only the reference to the file stored in Cauldron that is containing the configuration.  
  For this way to work, the file must exist in Cauldron (you can add a file to the cauldron by using the [ern cauldron add file] command).  
  This is the recommend approach, especially for large configurations, as the configuration is kept separate from the main Cauldron document (not bloating it) and all configurations can be grouped in a specific location in Cauldron, making it easier to refer to and manage.


### Examples

- `ern cauldron add publisher -p git -u git@github.com:user/walmart-ios-container.git -d walmart:ios`  
Add a git publisher for the walmart iOS native application.  
All Containers generated from Cauldron for the walmart iOS application, will be published to the user/walmart-ios-container git repository on GitHub.

- `ern cauldron add publisher -p maven -u https://url/to/maven/repository -d walmart:android -e '{"artifactId": "walmart-android-container", "groupId": "com.walmart.container"}'`  
Add a maven publisher for the walmart Android native application.  
All Containers generated from Cauldron for the walmart Android application, will be published to the maven repository located at https://url/to/maven/repository. The artifactId/groupId used for the maven artifact will be walmart-android-container/com.walmart.container.

- `ern cauldron add publisher -p maven -u https://url/to/maven/repository -d walmart:android -e /path/to/walmart-maven-publisher-config.json`  
Same as previous example, but the json configuration (artifactId/groupId) is retrieved from a local file.

- `ern cauldron add publisher -p maven -u https://url/to/maven/repository -d walmart:android -e cauldron://config/walmart/publishers/maven-publisher-config.json`  
Same as previous example, but the maven publisher configuration is stored in the maven-publisher-config.json file in the config/walmart/publishers directory of the Cauldron.

_________
[ern cauldron add file]: ../add/file.md