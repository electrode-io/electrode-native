## Requirements

Considering that `Electrode React Native` is actually built on top of `React Native`, its requirements are mostly identical with `React Native` ones. If you have already installed `React Native` on your machine and played with it or actually developped some projects using it, then you should be good to go already. In any case case, please make sure to check the following list of requirements to start using `Electrode React Native`.

### [NodeJS](https://nodejs.org/en/) (>= 4.5)

Electrode React Native platform is actually for the most part a `NodeJS` application, and therefore requires the `NodeJS` runtime to be present on your workstation. If you don't have a `NodeJS` runtime already installed on your mahcine, you'll have to instal it in order to use the platform. Juse make sure to use a version of `NodeJS >= 4.5`, as it is the lowest version of `NodeJS` that Electrode React Native can run in.

You'll also need `npm` (or `yarn`) in order to actually install the platform itself. Luckily, `npm` comes along with `NodeJS`, so you'll be good to go just by installing `NodeJS`.

### NPM >= 3 or Yarn

**Electrode Native requires npm version >= 3**

`NodeJS` v6.x already comes with npm@3 by default, but if you are using `NodeJS` v4 for some reason, make sure you install npm@3 with the following command:

```bash
npm install -g npm@3
```

You can also use `yarn` instead of `npm`

### [Android Studio](htps://developer.android.com/studio/index.html)

You'll need to install [`Android Studio`](htps://developer.android.com/studio/index.html) if you want your `MiniApp` to target `Android` platform, or if you need in any way to generate containers targeting `Android` mobile application(s)

Once installed, just make sure to set the `ANDROID_SDK` env variable, to point to the location of the `Android` SDK, if it has not been set already (the following snippet reflects the detault SDK path, it might not be the same for you)

```
export ANDROID_SDK=/Users/[YOUR_USER_NAME]/Library/Android/sdk
````

### [XCode](https://developer.apple.com/xcode/) (>= 8.3.2)

You'll need to install [`XCode`](https://developer.apple.com/xcode/) if you want your `MiniApp` to target `iOS` platform,  or if you need in any way to generate containers targeting `iOS` mobile application(s).

Your version of `XCode` should be `>= 8.3.2` to ensure compatibility with Electrode React Native platform.

### Additional optional requirements

- If your workflow with the platform involves working with a `Cauldron`, you'll need to have a `GitHub` (or `BitBucket`) account. 

- If your workflow involves pushing OTA updates through `CodePush`, you'll need to have an account setup for `CodePush`.

### What about React Native ?

You actually don't need to have `React Native` installed on your machine. If you have it already installed, no worries, it's not really a problem. The same applies for `yarn` and `CodePush`.

Electrode React Native actually ships with its own local version of `React Native` as well as `Yarn` and `CodePush`. It lightens our list of requirements, which ultimately simplifies things for you, and also makes the platform more safe and stable as it does not have to deal with multiple different versions of these tools (indeed every user could have a different version of these tools installed.)

Ready ? OK, then let's get started !