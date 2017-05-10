ERN Cauldron API
===

Cauldron API uses git as a backend.  If no repository is given it only
does local changes.


#### Add a new cauldron repositiry to ern

Run the following command to add a repository with an associated alias to your ern config. 

```
-  ern cauldron repository add <repoAlias> <repoUrl>
```
 
 You can ass as many cauldron urls as you want using the above command and easily switch between cauldron instances using the `use` command as shown below.
 
 ```
 -  ern cauldron repository use <repoAlias>
 
 ```
 
 The following `ern cauldron repository` commands are now available for use:
 
 ```
- add <repoAlias> <repoUrl>  (to add a new Cauldron repository to your platform config)
- remove <repoAlias> (to remove an existing Cauldron repository from your platform config)
- list (to list all your current Cauldron repositories)
- current (to display the currently activated / in-use Cauldron)
- use <repoAlias> (to switch-to/use a given repository)
```


