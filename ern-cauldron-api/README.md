ERN Cauldron API
===

Cauldron is a version management server to keep an app in sync across IOS, Android and JavaScript world. It helps to keep track of the matrix of which TLA’s have what binary parts installed. 


Cauldron allows to easily group miniapps together, to (automatically) determine the correct (or incorrect) versions of native dependencies. Since cauldron keeps track of the versions of the apps/miniapps that is published the OTA relies on cauldron to identify if an OTA update can be pushed (compatibility check) to the live apps. 


Cauldron API uses git as a backend.  If no repository is given it only does local changes. 

Cauldron stores information in a single JSON document which will be auto generated and committed to the repo when you use cauldron cli. 

Applications can choose to have one cauldron repositiry per native app or organization since the API can store one or more native apps and it's dependencies in it's JSON file. 

#### Add a new cauldron repository to ern

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


