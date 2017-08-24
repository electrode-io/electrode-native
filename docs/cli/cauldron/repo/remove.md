**Removes a Cauldron repository**

### Command

#### `ern cauldron repository remove <alias>`

Will remove an existing Cauldron repository, given its `alias`, from a local collection of Cauldron repositories.  

If the `alias` does not exists, the command will fail.  

You also cannot remove a repository that is the currently activated one. If that is the case, you'll need to first switch to another repository using `ern cauldron repository use` before executing this command.