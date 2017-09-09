## `ern cauldron repo add <alias> <url>`
#### Description
* Add a Cauldron repository to a local collection of Cauldron repositories  

#### Syntax
`ern cauldron repo add <alias> <url>`  

**Example**  
`ern cauldron repo add my-cauldron git@github.com:User/Cauldron.git`  
This example shows how to add the Cauldron repository titled `my-cauldron`, that is located in the `git@github.com:User/Cauldron.git` directory, to your local collection of Cauldron repositories.    

**Options**  

`--current true/false`

* Set the repository as the active repository after adding it to the collection of repositories.  
* If this option is not provided, you are prompted to choose if you want to set the repository as the active repository.  

#### Remarks
* If the `alias` exists, the command fails.  
