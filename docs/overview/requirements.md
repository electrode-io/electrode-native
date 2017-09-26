## Requirements

Depending on whether you are building Android or iOS apps, the following tools are required: 
* Node.js 4.5 or later
* NPM >= 3 or Yarn 
* Android Studio for Android apps
* Xcode 8.3.2 or later for iOS apps

If you are already set up with React Native, then you probably have the required tools  installed.

### [Node.JS](https://nodejs.org/en/)

Electrode Native is primarily a Node.js application therefore, Node.js 4.5 or later must be installed on your workstation.

You also need to install NPM or Yarn in order to install the Electrode Native platform.   
**Note** When you install npm, Node.js is automatically installed.

### NPM >= 3 or Yarn

`NodeJS` v6.x already comes with npm@3 by default, but if you are using `NodeJS` v4 for some reason, make sure you install npm@3 with the following command:

```bash
npm install -g npm@3
```

### [Android Studio](htps://developer.android.com/studio/index.html)

You need to install [Android Studio](htps://developer.android.com/studio/index.html) if you want your MiniApp to target the Android platform or if you need to generate containers targeting Android mobile applications.

After you install Android Studio, set the `ANDROID_SDK env` variable to point to the location of the Android SDK--if it has not been set already. An example of the SDK path is shown below.  

```
export ANDROID_SDK=/Users/[YOUR_USER_NAME]/Library/Android/sdk
````

### [XCode](https://developer.apple.com/xcode/)

You need to install [XCode](https://developer.apple.com/xcode/) if you want your MiniApp to target the iOS platform  or if you need to generate containers targeting iOS mobile applications.  

XCode 8.3.2 or later is required to ensure compatibility with Electrode Native.

### Additional optional requirements

- If your workflow involves working with a cauldron, you'll need to have a GitHub or BitBucket account.

- If your workflow involves pushing OTA updates using CodePush, you'll need to have an account setup for CodePush.

### What about React Native ?

You don't need to have React Native installed on your machine. If you have it already installed, that's great--it's not really a problem. The same applies for yarn and CodePush.

Electrode Native ships with its own local version of React Native as well as Yarn and CodePush. Including these tools shorten our list of requirements--which ultimately simplifies setup for you and also makes the platform safer and stable as it does not require multiple versions of these tools--even though, every user could have a different version of these tools already installed.

Are you Ready?    OK, then let's get started!