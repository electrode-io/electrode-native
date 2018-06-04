# Electrode Native JCenter Container Publisher

This publisher can be used to publish Android Electrode Native Containers to a remote [JCenter](https://bintray.com/bintray/jcenter) repository.

You must have a [Bintray](https://bintray.com) account in order to use this publisher.

## Inputs

**Required**

- `containerPath` : Path to the Container to publish
- `containerVersion` : Version of the Container to publish
- `artifactId` : The artifact id to be used for the Container
- `groupId` : The group id to be used for the Container
- `bintrayUser` : The Bintray account username [*]
- `bintrayApiKey`: The Bintray account API key [*]
- `bintrayRepo` : The Bintray repository [*] 
- `bintrayVcsUrl` : The Bintray VCS url [*]

[*] These parameters will be retrieved from your global `~/.gradle/gradle.properties` file.

## Usage

### Through `ern publish-container` CLI command

To manually publish a Container the `ern publish-container` CLI command can be used as follow :

```bash
$ ern publish-container [pathToContainer] -p jcenter -v [containerVersion] -c '{"artifactId":"[artifactId]", "groupId":"[groupId]"}'
```  

### Through Cauldron

To automatically publish the Cauldron generated Containers of a target native application and platform, the `ern cauldron add publisher` command can be used as follow :

```bash
$ ern cauldron add publisher -p jcenter -c '{"artifactId":"[artifactId]", "groupId":"[groupId]"}'
```

This will result in the following publisher entry in Cauldron :

```
{
  "name": "jcenter",
  "artifactId": "[artifactId]", // Optional [Default: [nativeAppName]-ern-container]],
  "groupId" : "[groupId]" // Optional [Default: com.walmartlabs.ern]
}
```

### Through Code

```js
import JCenterPublisher from 'ern-container-publisher-jcenter'
const publisher = new JCenterPublisher()
publisher.publish({
    /* Local file system path to the Container */
    containerPath,
    /* Version of the Container. Jenter artifact version */
    containerVersion,
    /* Extra data specific to this publisher */
    extra: {
      /* Artifact id to use for publication */
      artifactId: string
      /* Group id to use for publication */
      groupId: string
    }
  }
})
```