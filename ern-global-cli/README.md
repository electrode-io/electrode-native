# Electrode React Native (ern) global client

This is a node project meant to be installed globally on the user workstation through :

`npm install -g @walmart/electrode-react-native`

This will make the `ern` binary available globally.

The job of this binary is solely to bootstrap the platform and also proxy all commands to the local client of the currently activated platform version.

These two responsibilities can be summarized as follow :

- `Bootstraping` : Whenever the user run `ern` comand for the first time ever on his/her workstation, the global client will create the platform folders and initial configuration file and will download the latest platform version.  

- `Proxy to local client` : If there is at least a version of the platform installed, this global client will just act as a proxy to the local client ([ern-local-cli](../ern-local-cli)) of the currently activated platform version.

If you have to work on this client, you can run `npm link` from this folder, then access `ern` as a normal user would.

That being said, this project should hopefully never be modified. We really really don't want to ask users to update this global client. The local client should be modified instead.
