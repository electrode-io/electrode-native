## Electrode Native CLI

The Electrode Native CLI is the Electrode Native platform command line client. The Electrode Native CLI is written in JavaScript (ES6) and runs in Node.js 4.5.0 and later.

Use the Electrode Native CLI to access platform functionality. However, if you are working only on the mobile application side, you may not need to use the Electrode Native CLI at all.

The Electrode Native CLI is actually composed of two clients: a `global client` and a `local client`.

### Electrode Native global CLI client

The Electrode Native  global client is installed globally on your machine using the `npm install -g electrode-native` command.  
* The global client is a lightweight client that contains the `ern` binary.   
* When you enter an `ern` command in your terminal, the command first passes through the global client before reaching the local client.  
* The global client role is used to bootstrap first-time platform installation as well as redirect commands to the currently activated local client version.  
* The global client is rarely updated.  

### Electrode Native local client

The Electrode Native local CLI client

The Electrode Native local CLI client is installed automatically by the Electrode Native platform when you run the `ern platform install` command.

When you issue Electrode Native CLI commands, you use the local client.
You can have multiple local client versions on your workstation as each Electrode Native platform version that you install on your system will have it's own version of the Electrode Native CLI installed.
Only a single version of an Electrode Native CLI can be active at any given time.
You can switch between versions of the local client using the `ern platform use` command.

For information about available Electrode Native CLI commands, checkout our CLI documentation.
