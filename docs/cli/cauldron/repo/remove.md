## `ern cauldron repo remove <alias>`
#### Description
* Remove an existing Cauldron repository, identified by its `alias`, from a local collection of Cauldron repositories    

#### Syntax
`ern cauldron repo remove <alias>`  


#### Remarks
* This command fails if the `alias` does not exist in the local collection of Cauldron repositories.  
* You cannot remove a currently active repository.  
To remove a currently active repository:  
1) Switch to another repository using the `ern cauldron repo use` command.  
2) Use the `ern cauldron repo remove <alias>` command.
