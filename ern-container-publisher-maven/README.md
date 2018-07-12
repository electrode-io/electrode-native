# Electrode Native Maven Container Publisher

This publisher can be used to publish Android Electrode Native Containers to a local or remote Maven repository.

## Inputs

**Required**

- `containerPath` : Path to the Container to publish
- `containerVersion` : Version of the Container to publish

**Optional**

- `url` : Url of the repository to publish the artifact to (default: maven local `~/.m2/repository` )
- `artifactId` : The artifact id to be used for the Container (default : `local-container`)
- `groupId` : The group id to be used for the Container (default: `com.walmartlabs.ern`)
- `mavenUser`:The user to use to publication. Not needed for publication to maven local (default: retrieved from `~/.gradle/gradle.properties`)
- `mavenPassword` : The password to use for publication. Not needed for publication to maven local (default: retrieved from `~/.gradle/gradle.properties`)

## Usage

### **With `ern publish-container` CLI command**

**Required**

- `--publisher/-p` : `maven`
- `--platform` : `android`
- `--url/-u` : Url of the target maven repository to publish the container to
- `--config/-c` : A json string (or path to a json file) containing the following  properties:
  - `artifactId` : The artifact id to be used for the Container
  - `groupId` : The group id to be used for the Container
  - `mavenUser` [Optional] : The username for Maven publication (defaults to `mavenUser` gradle variable name. Retrieved from `~/.gradle/gradle.properties`)
  - `mavenPassword` [Optional] : The username for Maven publication (defaults to `mavenPassword` gradle variable name. Retrieved from `~/.gradle/gradle.properties`)

**Optional**

- `--containerPath` : Path to the Container to publish.  
Defaults to the Electrode Native default Container Generation path (`~/.ern/containergen/out/[platform]` if not changed through config)

- `--containerVersion/-v` : Version of the Container to publish.  
Default to `1.0.0`

 The `ern publish-container` CLI command can be used as follow to manually publish a Container using the maven publisher :

```bash
$ ern publish-container --containerPath [pathToContainer] -p maven -v [containerVersion] -u [mavenRepoUrl] -c '{"artifactId":"[artifactId]", "groupId":"[groupId]", "mavenUser":"[mavenUser]", "mavenPasword":"[mavenPassword]"}'
```  

### **With Cauldron**

**Required**

- `--publisher/-p` : `maven`
- `--url/-u` : Url of the target maven repository to publish the container to

**Optional**

- `--config/-c` : A json string (or path to a json file) containing the following required properties:
  - `artifactId` : The artifact id to be used for the Container  
  Defaults to `[nativeAppName]-ern-container`
  - `groupId` : The group id to be used for the Container  
  Defaults to `com.walmartlabs.ern`
  - `mavenUser` : The username for Maven publication  
  Defaults to `mavenUser` gradle variable name.  
  Retrieved from `~/.gradle/gradle.properties`
  - `mavenPassword` : The username for Maven publication
  Defaults to `mavenPassword` gradle variable name.  
  Retrieved from `~/.gradle/gradle.properties`

To automatically publish the Cauldron generated Containers of a target native application and platform, the `ern cauldron add publisher` command can be used as follow :

```bash
$ ern cauldron add publisher -p maven -u [mavenRepoUrl] -c '{"artifactId":"[artifactId]", "groupId":"[groupId]", "mavenUser":"[mavenUser]", "mavenPassword": "[mavenPassword]"}' 
```

This will result in the following publisher entry in Cauldron :

```json
{
  "name": "maven",
  "url": "[mavenRepoUrl]",
  "extra": {
    "artifactId": "[artifactId]",
    "groupId" : "[groupId]",
    "mavenUser": "[mavenUser]",
    "mavenPassword": "[mavenPassword]"
  }
}
```

This is only needed once. Once the configuration for the publisher is stored in Cauldron, any new Cauldron generated Container will be publihsed to maven.

### **Programatically**

```js
import MavenPublisher from 'ern-container-publisher-maven'
const publisher = new MavenPublisher()
publisher.publish(
  {
    /* Local file system path to the Container */
    containerPath: string
    /* Version of the Container. Maven artifact version */
    containerVersion: string
    /* Url of the maven repository. Default: maven local */
    url?: string
    /* Extra config specific to this publisher */
    extra?: {
      /* Artifact id to use for publication. Default: local-container */
      artifactId?: string
      /* Group id to use for publication. Default: com.walmartlabs.ern */
      groupId?: string
      /* Password to use for publication. Default: retrieved from ~/.gradle/gradle.properties */
      mavenPassword?: string
       /* User to use for publication. Default: retrieved from ~/.gradle/gradle.properties */
      mavenUser?: string
    }
  }
})
```
