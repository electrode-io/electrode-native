## Electrode React Native CLI

The ERN CLI is the ERN platform command line client. The ERN CLI is written in JavaScript (ES6) and runs in Node.js 4.5.0 and later.

Use the ERN CLI to access platform functions. However, if you are working only on the mobile application side, you may not need to use the ERN CLI.

The ERN CLI has two clients: a global client and a local client.

### ERN global CLI client

The ERN  global client is installed globally on your machine using the `npm install -g electrode-react-native` command.  
* The global client is a lightweight client that contains the `ern` binary.   
* When you enter an `ern` command in your terminal, the command first passes through the global client before reaching the local client.  
* The global client role is used to bootstrap first-time platform installation as well as redirect commands to the currently activated local client version.  
* The global client is rarely updated.  

### ERN local client

The ERN local CLI client

The ERN local CLI client is installed automatically by the ERN platform when you run the `ern platform install` command.

When you issue ERN CLI commands, you use the local client.
You can have multiple local client versions on your workstation as each ERN platform version that you install on your system will have it's own version of the ERN CLI installed.
Only a single version can be active at any given time.
You can switch between versions of the local client using the `ern platform use` command.

For information about available Electrode React Native CLI commands, checkout our [CLI documentation](url)
