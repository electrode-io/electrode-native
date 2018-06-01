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

### Through `ern publish-container` CLI command

```bash
$ ern publish-container [pathToContainer] -p maven -v [containerVersion] -u [mavenRepoUrl] -c '{"artifactId":"[artifactId]", "groupId":"[groupId]", "mavenUser":"[mavenUser]", "mavenPasword":"[mavenPassword]"}'
```  

### Through Cauldron

To automatically publish the Cauldron generated Containers of a target native application and platform, the `ern cauldron add publisher` command can be used as follow :

```bash
$ ern cauldron add publisher -p maven -u [mavenRepoUrl] -c '{"artifactId":"[artifactId]", "groupId":"[groupId]"}, "mavenUser":"[mavenUser]", "mavenPassword": "[mavenPassword]"}' 
```

This will result in the following publisher entry in Cauldron :

```json
{
  "name": "maven",
  "url": "[mavenRepoUrl]",
  "artifactId": "[artifactId]", // Optional [Default: [nativeAppName]-ern-container],
  "groupId" : "[groupId]", // Optional [Default: com.walmartlabs.ern],
  "mavenUser": "[mavenUser]", // Optional [Default : retrieved from ~/.gradle/gradle.properties]
  "mavenPassword": "[mavenPassword]" // Optional [Default : retrieved from ~/.gradle/gradle.properties]
}
```

### Through Code

```javascript
import MavenPublisher from 'ern-container-publisher-maven'
const publisher = new JCenterPublisher()
publisher.publish(
  {
    /* Local file system path to the Container */
    containerPath: string
    /* Version of the Container. Maven artifact version */
    containerVersion: string
    /* Url of the maven repository. Default: maven local */
    url?: string
    /* Extra data specific to this publisher */
    extra?: {
      /* Artifact id to use for publication. Default: local-container */
      artifactId?: string
      /* Group id to use for publication. Default: com.walmartlas.ern */
      groupId?: string
      /* Password to use for publication. Default: retrieved from ~/.gradle/gradle.properties */
      mavenPassword?: string
       /* User to use for publication. Default: retrieved from ~/.gradle/gradle.properties */
      mavenUser?: string
    }
  }
})
```