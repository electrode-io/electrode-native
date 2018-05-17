## Requirements

Depending on whether you are building Android or iOS apps, the following tools are required:

* Node 6+
* NPM 3+ or Yarn
* Android Studio for Android apps
* Xcode 9.2+ for iOS apps

If you have React Native already installed, then you probably have the required tools installed.

### [Node 6+](https://nodejs.org/en/)

Electrode Native is primarily a Node.js application therefore, Node 6+ must be installed on your workstation.  

**Note** You also need to install NPM or Yarn in order to install the Electrode Native platform. When you install Node.js, NPM is automatically installed.

### NPM 3+ or Yarn

### [Git](https://git-scm.com/downloads)

You need to have the `git` command line client installed on your workstation and declared in your PATH (i.e if you type `git` from a command prompt / terminal, it should not fail with "command not found" error).  

Electrode Native is relying on the `git` client for [Cauldron](../platform-parts/cauldron.md) access as well as [Manifest](../platform-parts/manifest.md) access, and also to publish your Containers to git if you want to use such a publisher.

### [Android Studio](https://developer.android.com/studio/index.html)

You need to install [Android Studio](https://developer.android.com/studio/index.html) if you want your MiniApp to target the Android platform or if you need to generate containers targeting Android mobile applications.

After you install Android Studio, set the `ANDROID_SDK env` variable to point to the location of the Android SDK--if it has not been set already. An example of the SDK path is shown below.  

```bash
$ export ANDROID_SDK=/Users/[YOUR_USER_NAME]/Library/Android/sdk
```

### [Xcode 9.2+](https://developer.apple.com/xcode/)

You need to install [Xcode](https://developer.apple.com/xcode/) if you want your MiniApp to target the iOS platform  or if you need to generate containers targeting iOS mobile applications.

- **XCode 9.2** or later version is required.

### Additional optional requirements

- If your workflow involves working with a cauldron, you'll need to have a GitHub or BitBucket account.

- If your workflow involves pushing OTA updates using CodePush, you'll need to have an account setup for CodePush.

### What about React Native ?

You don't need to have React Native installed on your machine. If you have it already installed, that's great--it's not really a problem. The same applies for yarn and CodePush.

Electrode Native ships with its own local version of React Native as well as Yarn and CodePush. Including these tools shorten our list of requirements--which ultimately simplifies setup for you and also makes the platform safer and stable as it does not require multiple versions of these tools--even though, every user could have a different version of these tools already installed.

Are you Ready?    OK, then let's get started!
