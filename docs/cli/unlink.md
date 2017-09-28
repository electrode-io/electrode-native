## `ern unlink`
#### Description
* Remove the link associated to a MiniApp directory  

#### Syntax
`ern unlink`


#### Remarks
* You must run this command from within a MiniApp working directory that was linked using the `ern link` command.  
* When you remove the link associated to a MiniApp directory, the package launched using the `ern start` command, won't use this MiniApp directory any longer to load the code of the MiniApp.  

#### Related commands
 [ern link] | Link to a MiniApp directory

[ern link]: ./link.md