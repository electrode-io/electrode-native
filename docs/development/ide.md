IDE Setup
===
To make all the projects use the same versions of babel and corresponding configuration,
we use ern-babel, ern-mocha and babelhook respectively. Babelhook is basicaly babel-registry,
with our configuration.

Running tests
===
To run tests from the cli you can run ern-mocha.

```sh
$ cd ern-api-gen
$ npm run test 
```

To run tests from IntelliJ add this to your mocha config.
--compilers js:ern-util-dev/babelhook see screenshot.


![Mocha Setup](./img/mocha-setup.png)