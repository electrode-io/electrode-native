# Electrode Native Git Container Publisher

This publisher can be used to publish Android and iOS Electrode Native Containers to a remote git repository. The git repository provider should not matter (GitHub, BitBucket, TFS ...).

The target git remote repository must exist. It will not be created by this publisher.

For example, For initial publication to GitHub, a repository should be created in GitHub beforehand.

**This publisher currently always publish to the master branch of the remote repository.**

## Usage

### **With `ern publish-container` CLI command**

**Required**

- `--url/-u` : Url of the remote git repository (SSH or HTTPS) to publish to
- `--publisher/-p` : `git`
- `--platform` : `android` | `ios`

**Optional**

- `--containerPath` : Path to the Container to publish.  
Defaults to the Electrode Native default Container Generation path (`~/.ern/containergen/out/[platform]` if not changed through config)

- `--containerVersion/-v` : Version of the Container to publish.  
Default to `1.0.0`

 The `ern publish-container` CLI command can be used as follow to manually publish a Container using the git publisher :

```bash
$ ern publish-container --containerPath [pathToContainer] -p git -u [gitRepoUrl] -v [containerVersion] ---platform [android|ios]
```

### **With Cauldron**

**Required**

- `--publisher/-p` : `git`
- `--url/-u` : Url of the remote git repository (SSH or HTTPS) to publish to

To automatically publish Cauldron generated Containers of a target native application and platform, the `ern cauldron add publisher` command can be used as follow :

```bash
$ ern cauldron add publisher -p git -u [gitRepoUrl]
```

This will result in the following publisher entry in Cauldron :

```json
{
  "name": "git",
  "url": "[gitRepoUrl]"
}
```

This is only needed once. Once the configuration for the publisher is stored in Cauldron, any new Cauldron generated Container will be publihsed to git.

### **Programatically**

```js
import GitPublisher from 'ern-container-publisher-git'
const publisher = new GitPublisher()
publisher.publish({
  /* Local file system path to the Container */
  containerPath,
  /* Version of the Container. Will result in a git tag. */
  containerVersion,
  /* Remote git repository url (ssh or https) */
  url
})
```

