An Electrode Native container contains the following:

- MiniApps  
  The MiniApps are packaged inside a single JavaScript bundle containing all of the JavaScript code of all the MiniApps.

- MiniApps assets  
  the MiniApps assets are the fonts and images that are used by the MiniApps.

- MiniApps native dependencies  
  The MiniApps native dependencies are all of the native dependencies that MiniApps directly or indirectly depend on

  - Native modules
  - Electrode Native APIs
  - Native APIs impelentations

- JavaScript APIs implementations

- Container specific code  
  An Electrode Native container includes some code that is exposed to mobile application developers to properly integrate a container in their mobile application. This consists mostly of code to initialize the container along with some utility code to access and deal with the MiniApps stored within.
