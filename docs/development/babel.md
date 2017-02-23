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
The babel configuration is stored in ern-util-dev/babelrc.json.  It follows the .babelrc format and currently is 
configured thusly:
```json

{
  "presets": [
    "node6"
  ],
  "plugins": [
    "syntax-async-functions",
    "transform-async-to-generator",
    "transform-object-rest-spread"
  ]
}

```

