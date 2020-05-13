Setting up a cauldron is basically the same process as creating a Git repository and storing the data in the repository. If you know how to create a git repository, then you know how to create a Cauldron. To host your cauldron, you can use any provider offering Git repository storage. GitHub and BitBucket are probably two of the most popular providers. Within our documentation, we mention GitHub but you are free to use the provider of your choice.

To create your own mobile application cauldron:

1. Create a new GitHub repository to host your cauldron.  
   While there are no repository naming conventions, we recommend that you name it: `[mobile_app_name]-cauldron`

Note: A cauldron is bound to one mobile application--even though it can hold multiple mobile applications. We do not recommend holding multiple mobile applications within a cauldron.

2. Add the cauldron to the repository using the Electrode Native CLI.

```bash
$ ern cauldron repo add <cauldron-alias> <cauldron-url>
```

3. Add your first mobile application version in the cauldron.

```bash
$ ern cauldron add <native-app-descriptor>
// for example
// ern cauldron add nativeapp MyApp:ios:0.0.1
// ern cauldron add nativeapp MyApp:android:0.0.1
```

The descriptor provided to this command should be a complete native application descriptor.
