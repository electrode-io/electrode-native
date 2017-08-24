**Adds a Cauldron repository**

### Command

#### `ern cauldron repository add <alias> <url>`

Will add a Cauldron repository to a local collection of Cauldron repositories.  

The `alias` should be a given custom alias of your choice to easily refer to this Cauldron repository.
The `url` should be the git repository url (ssh or https) of the Cauldron. 

For example, `ern cauldron repository add git@github.com:User/Cauldron.git my-cauldron` will add the Cauldron repository located in `git@github.com:User/Cauldron.git` to your local collection of Cauldron repositories, and associate the `alias` `my-cauldron` to it.  

If the `repoAlias` is already used, the command will fail.

#### `ern cauldron repository add <alias> <url> --current true/false`

This will set the repository as the current activated one after adding it. 
If this flag is not provided, you will be prompted by the command to choose if you want to set it as the currently activated repository or not.