The Electrode Native global client is installed globally on your machine using the `npm install -g electrode-native` command.

- The global client is a lightweight client that contains the `ern` binary.
- When you enter an `ern` command in your terminal, the command first passes through the global client before reaching the local client.
- The global client role is used to bootstrap first-time platform installation as well as redirect commands to the currently activated local client version.
- The global client is rarely updated.
