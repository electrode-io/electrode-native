## `ern cauldron repo add`

#### Description

* Add a Cauldron repository to the local collection of Cauldron repositories  

#### Syntax

`ern cauldron repo add <alias> <url>`  

**Arguments**

`<alias>`

* Alias to associated to the cauldron repository url.

`<url>`

* HTTPS or SSH url to the Cauldron git repository
* Can also use `local` as the url. In that case, a local Cauldron repository will be created. Local Cauldrons are only local to the workstation, and thus cannot be used by other users. A local Cauldron can be of use for using a Cauldron with Electrode Native without having to create a remote git repository. It is also much faster than a remote Cauldron given that it does not have to sync with the remote.
* For HTTPS urls, the username and password (or token) must be specified in the URL (valid formats are `https://[username]:[password]@[repourl` or `https://[token]@[repourl]`).
* By default, the `master` branch of the repository will be used. If you need to use a different branch, you can set the branch name you want to use, by appending it at the end of the url using the `#[branch-name]` format (second example below illustrate this).

**Options**  

`--current true|false`

* Set the repository as the active repository after adding it to the collection of repositories.  
* If this option is not provided, you are prompted to choose if you want to set the repository as the active repository.  

**Example**  

`ern cauldron repo add my-cauldron git@github.com:User/Cauldron.git`  
Add a new Cauldron repository, with alias `my-cauldron`, and url `git@github.com:User/Cauldron.git`, to your local collection of Cauldron repositories. The branch that will be used for this Cauldron will be `master` as no branch was explicitly specified.

`ern cauldron repo add my-other-cauldron git@github.com:User/OtherCauldron#development --current`  
Add a new Cauldron repository, with alias `my-other-cauldron`, and url `git@github.com:User/OtherCauldron`, to your local collection of Cauldron repositories and set it at the current activated Cauldron. The branch that will be used for this Cauldron will be `development` as it was explicitly specified in the Cauldron url.

#### Remarks

* If the `alias` already exists, this command will fail.
