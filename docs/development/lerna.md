Lerna
===
To manage the dependencies between projects we are using [Lerna](https://github.com/lerna/lerna) now.  


## Using

Whenever you add a new @walmart/ern- package or a dependency to an @walmart/ern- package run 
```bash
$ npm run rebuild
```
This should clean everything regenerate the dist folders and link the respective projects back together.

## Dev Upgrade to Lerna
Due to some new dependencies and reworking the dev upgrade requires a few steps.
To upgrade from the previous version of ern-platform to the current version.   The new version uses npm link rather
than the home grown solution.   It also 

```bash
  $ rm -f /usr/local/bin/ern
  $ npm uninstall -g @walmart/electrode-react-native
  $ cd ern-platform
  $ git pull origin master
  $ npm install 
  $ npm run rebuild
  $ npm link
```


