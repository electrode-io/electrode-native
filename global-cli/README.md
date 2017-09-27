# Electrode Native Global CLI

This is a node project meant to be installed globally on the user workstation through :

`npm install -g electrode-native`

This will make the `ern` binary available globally.

The job of this binary is solely to bootstrap the platform and also proxy all commands to the local client of the currently activated platform version.

These two responsibilities can be summarized as follow :

- `Bootstrapping` : Whenever the user run `ern` command for the first time ever on his/her workstation, the global client will create the platform folders and initial configuration file and will install the latest platform version.

- `Proxy to local client` : If there is at least a version of the platform installed, this global client will just act as a proxy to the local client ([ern-local-cli](../ern-local-cli)) of the currently activated platform version.

If you have to work on this client, you can run `npm link` from this folder, then access `ern` as a normal user would.

This project should hopefully never be modified. We really really don't want to ask users to update this global client. The local client should be modified instead.  

That being said the global client will check for updates every 24 hours. If an updated version is available, it will inform the user that a new version is available and give him the instructions to update the client.  

For example, here is how the current notification looks like :

```
╭────────────────────────────────────────────────────────────╮
│                                                            │
│              Update available 0.0.3 → 0.0.4                │
│          Run npm i -g electrode-native to update           │
│                                                            │
╰────────────────────────────────────────────────────────────╯
```  

We cannot assume however that every user will update, therefore, updates of the global client should maintain backward compatibility.
