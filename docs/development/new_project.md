New Projects
===
Projects are good, they isolate logic, give a place to document and test, allow for reuse.   However whenever a project
becomes a bunch of projects things can go sideways.    This is a short guide to setting up a project within 
@walmart/ern-, by following a few rules we can automate a lot of the ugliness.




## Setup
### Init
To begin a new project use npm init.  The project should be in the @walmart scope, and should be a the same version
as ern-platform.   

The project should be layed out as follows.


```
ern-platform/ern-your-project
├── src/
│   └── index.js
│          └── Contains your code.  You can break it down even further.
├── test/
│   ├── your-project-test.js
│   │       └── Needs to end in -test.js for mocha to find it.
│   │
│   └── fixtures/
│       └── Contains fixtures, (samples, output,etc.).
├── README.md
│       └── Please have a readme. A real readme.
├── .npmignore
│       └── ignores test directory. dist directory is included, but excluded from gitignore up a level.
└── package.json
        ├── name : <@walmart/ern-your-project>
        ├── version : <ern-project version>
        ├── main : "dist/index.js"
        ├── scripts
        │        ├── test:"ern-mocha" 
        │        ├── build:"ern-babel" 
        │        └── prepublish:"npm run build"
        │        
        └── devDependencies
                   └── has a dependency to @walmart/ern-util-dev at the same version
      

```

### Post init
After init you need to have lerna do the magic for you.
```bash
$ cd ern-project
$ npm run rebuild
``` 
 


