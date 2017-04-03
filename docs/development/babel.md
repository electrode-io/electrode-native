ERN Babel
===
In order to use the same version of babel across projects with the same configuration a couple tools have been created.

* ern-babel - runs the babel command line with our babel configuration. It takes no args, but runs relative to the $PWD.
* ern-mocha - runs mocha with our babel configuration and our mocha configuration, takes no args but runs relative to the $PWD.

To enable thest tools and other there is the babelhook script it can be used as follows
```sh
 $ node -r @walmart/ern-util-dev/babelhook <your_script>
```



## ERN-DEV
ern is the command used to interact with Electrode Mobile Platform.   To make development easier a new command ern-dev 
has been added that will transpile in real time.  This makes working with packages much easier.  As you do not have
to recompile each package before using it.



##Configuration
Platform relies on two different babel configurations, one for prod (versions of the platform released for consumption) and another one for development, used solely for platform development.   
These configurations are stored in `ern-util-dev/babelrc.dev.json` and ``ern-util-dev/babelrc.prod.json`. 
They follow the .babelrc format and currently are 
configured thusly:


`babelrc.prod.json`

```json
{
  "presets": [
    [ "env", { 
      "targets": { "node": 4 }
    }]
  ],
  "plugins": [
    "syntax-async-functions",
    "transform-async-to-generator",
    "transform-object-rest-spread"
  ]
}
```

`babelrc.dev.json`

```json
{
  "presets": [ 
    "env"
  ],
  "plugins": [
    "syntax-async-functions",
    "transform-async-to-generator",
    "transform-object-rest-spread"
  ]
}
```

