Setting up development environment 
==

Here are the instructions to setup development environment (for platform contributors) :

1) Install the platform global client
```bash
$ npm install -g @walmart/electrode-react-native
```

2) Run `ern` a first time to bootstrap things

3) Fork the platform repository and clone it somewhere on your workstation

4) From your cloned repository root folder run the following commands in order :

```bash
$ npm install
$ npm run rebuild
$ npm run setup-dev
$ cd ern-util-dev
$ npm link
```

You are now all setup for development. Just make sure to run the following command ...

```bash
$ ern platform use v1000
```

... so that whenever you run `ern` it will point to your cloned repository. You can install other platform versions and switch between platform versions as any platform user, but keep in mind that only `v1000` will point to your local cloned workspace.
