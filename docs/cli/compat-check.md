## `ern compat-check`
#### Description
* Check the compatibility of one or more MiniApps with a given native application version.   
* Display a compatibility report indicating if the MiniApps are compatible with the given native application version  
* Display a formatted table listing all compatible dependencies and their versions as well as incompatible dependencies to help you pinpoint any problematic non-compatible native dependencies  

#### Syntax
`ern compat-check`  

* You can run the `ern compat-check` command without arguments if you are in a MiniApp directory.  
* If you run the `ern compat-check` command without arguments and you are not in a MiniApp directory, the command logs an error and exits.  

`ern compat-check <miniapp>`

* Check the compatibility of a specified MiniApp with a native application version  
The MiniApp can be any valid Yarn package descriptor or you can use Git or other file system path scheme.  


**Options**  

`--miniapps/-m`

* Check the compatibility of one or more MiniApps with a native application version  
The MiniApps can be any valid Yarn package descriptor or you can use Git or other file system path scheme.  

`--descriptor/-d`

* Check the compatibility of one or more MiniApps with a native application version  
Specify the native application version as a *complete native application descriptor* for which to check compatibility with the MiniApps  
