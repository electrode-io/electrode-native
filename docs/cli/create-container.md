## `ern create-container`

#### Description

* Create a new container (native or JavaScript only) locally to the workstation.

#### Syntax

`ern create-container`  

**Options**  

`--jsOnly/--js`

* Create a JavaScript-only container  
* A JavaScript-only container is also known as a *MiniApps composite*.   
* **Default**  If this option is not used, a full native container including the JavaScript bundle containing all MiniApps, is generated.

`--descriptor/-d <descriptor>`

* Create a new container including all the MiniApps listed in the Cauldron for the given *complete native application descriptor*  
* Use this option if you want to locally generate a container that mirrors the container of a given native application version.  

`--miniapps/-m <miniapps>`

* Create a new custom container including all the given MiniApps  
* The MiniApps passed to this command can be a valid Yarn package format or a Git format or file scheme.  

`--dependencies/--deps <dependencies>`

* Inject the provided extra native dependencies in your locally generated container  
* This option can only be used when generating a container that is not JavaScript only (`--js` switch), or based on a native application version from Cauldron (`--descriptor` option).  
For the latter, if you want to add extra native dependencies to your container that are not listed as dependencies of any of the MiniApps, you can instead use the `ern cauldron add dependencies` command to add the extra native dependencies directly in the native application version stored in Cauldron.  
You can only provide published dependencies to this command.  
You cannot use the Git or file package descriptors for referring to the dependencies.

`--platform/-p <android|ios>`

* Specify the target platform for this container   
* If not explicitly provided, the command prompts you to choose between the iOS or the Android platform before execution.

`--outDir/--out <directory>`

* Specify the output directory where the container generated project should be stored upon creation  
* **Default**  If this option is not provided, the container is generated in the default platform directory `~/.ern/containergen/out`.

`--ignoreRnpmAssets`

* Inform the Container generator to ignore any rnpm assets optionally declared by MiniApps. This can be used in case you want to keep specific rnpm assets inside the native application itself and not the Container.
* This flag wil have no effect for a Container generated from a Cauldron as the Container configuration stored in the Cauldron will take precedence.
* **Default** Do not ignore rnpm assets and package them inside the generated Container.

`--extra/-e`
* Optional extra configuration specific to creating container
* Override the android build config during container generation by passing `androidConfig` attributes
  - **As a json string**  
  For example `--extra '{"androidConfig": {"androidGradlePlugin": "3.2.1","buildToolsVersion": "28.0.3","compileSdkVersion": "28","gradleDistributionVersion": "4.6","minSdkVersion": "19","supportLibraryVersion": "28.0.0","targetSdkVersion": "28"}}'`    
  - **As a file path**  
  For example `--extra /Users/username/my-container-config.json`  
  In that case, the configuration will be read from the file.  
  - **As a Cauldron file path**  
  For example `--extra cauldron://config/container/my-container-config.json`  
  In that case, the configuration will be read from the file stored in Cauldron.   
  For this way to work, the file must exist in Cauldron (you can add a file to the cauldron by using the [ern cauldron add file] command).

#### Remarks

* The `ern create-container` command can be used to create a container locally, for development, debugging and experimentation purposes.  
* Container generation and publication are two separate processes. If you want to publish your Container (to a git or maven repository) after locally creating it, you can make use of the `ern publish-container` command.
* To create a container that is published so that your native application team can use the container, you should use one of the Cauldron commands to add your MiniApps to a specified native application version in the Cauldron, which will trigger the generation and publication of a Container. See *Related commands*.  
* For Android OS, the Container is also published to your local Maven repository.  

#### Related commands

[ern publish-container] | Publish a local Container.

[ern publish-container]: ./publish-container.md