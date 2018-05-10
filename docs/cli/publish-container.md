## `ern publish-container`

#### Description

* Publish a local Container
* This command can be used to publish a Container that was generated locally (using `create-container` commmand) to a Git or Maven repository.

#### Syntax

`ern publish-container <containerPath>`  

**Arguments**

`<containerPath>`

* The local file system path to the directory containing the Container to publish.

**Options**  

`--version/-v <version>`

* Specify the Container version to use for publication.
* The version must be in the format: `x.y.z` where x, y and z are integers. For example `version=1.2.30`.
* Defaults to `1.0.0`.

`--publisher/-p <publisher>`

* Specify the publisher to use. Can either be `maven` or `github`.
* This option is required, there is no default.

`--url/-u <url>`

* The publication url to publish the Container to.
* Can either be the url of a Git repository or a Maven repository (local or remote), depending on the publisher being used.
* This option is required for the `github` publisher. For `maven` publisher, it will default to the standard Maven local path (`~/.m2/repository`) if not specified.

`--config/-c <config>`

* Optional publisher configuration provided as JSON.
* As of this version of Electrode Native, Maven and jcenter publisher are the only ones to expose some extra configuration. 
* Sample maven: `--config '{"artifactId":"test-container","groupId":"com.walmartlabs.ern","mavenUser":"user","mavenPasword":"password"}'`
* Sample jcenter: `--config '{"artifactId":"test-container","groupId":"com.walmartlabs.ern"}'`. Other bintray related details(bintrayUser, bintrayApiKey, bintrayRepo & bintrayVcsUrl) need to be provided inside your global `~/.gradle/gradle.properties` file.
* Configuration can be omitted or partially provided. The default configuration values used for the Maven publisher are :
  - artifactId: `local-container`
  - groupId: `com.walmartlabs.ern`
  - mavenUser : `undefined` (maven only)
  - mavePassword: `undefined` (maven only)

#### Related commands

[ern create-container] | Create a new container (native or JavaScript only) locally to the workstation.

[ern create-container]: ./create-container.md