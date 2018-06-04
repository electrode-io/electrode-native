# Electrode Native Git Container Publisher

This publisher can be used to publish Android and iOS Electrode Native Containers to a remote git repository. The git repository provider should not matter (GitHub, BitBucket, TFS ...).

The target git remote repository must exist. It will not be created by this publisher.

For example, For initial publication to GitHub, a repository should be created in GitHub beforehand.

**This publisher currently always publish to the master branch of the remote repository.**

## Inputs

**Required**

- `containerPath` : Path to the Container to publish
- `containerVersion` : Version of the Container to publish
- `url` : Url of the remote git repository (SSH or HTTPS) to publish to

## Usage

### Through `ern publish-container` CLI command

To manually publish a Container the `ern publish-container` CLI command can be used as follow :

```bash
$ ern publish-container [pathToContainer] -p git -u [gitRepoUrl] -v [containerVersion]
```

### Through Cauldron

To automatically publish the Cauldron generated Containers of a target native application and platform, the `ern cauldron add publisher` command can be used as follow :

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

### Through Code

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

