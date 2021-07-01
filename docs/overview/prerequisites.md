## Prerequisites

- Node.js >= 12
- Git
- Android Studio (for Android apps)
- Xcode >= 10 (for iOS apps)
- CocoaPods (if using a version of React Native >= 0.60)

### [Node](https://nodejs.org/en/)

Electrode Native is a Node.js application therefore, Node.js 12+ must be installed on your workstation.

### [Git](https://git-scm.com/downloads)

The `git` command line client must be present on your workstation and declared in your PATH _(i.e running `git` from a terminal, should not fail with "command not found" error)_

Electrode Native is relying on the `git` client for [Cauldron](../platform-parts/cauldron/index.md) and [Manifest](../platform-parts/manifest/index.md) access.

### [Android Studio](https://developer.android.com/studio/index.html)

[Android Studio](https://developer.android.com/studio/index.html) is required if you are targeting Android platform.

After you install Android Studio, set the `ANDROID_SDK env` variable to point to the location of the Android SDK--if it has not been set already. An example of the SDK path is shown below.

```bash
$ export ANDROID_SDK=/Users/[YOUR_USER_NAME]/Library/Android/sdk
```

### [Xcode](https://developer.apple.com/xcode/)

[Xcode](https://developer.apple.com/xcode/) is required if you are targetting iOS platform.

**Xcode 10** or later version is required.

### [CocoaPods](https://cocoapods.org/)

If running Electrode Native on a Mac, and using a version of React Native >= 0.60, CocoaPods install is required even if only targeting Android platform.

### Additional optional requirements

If your workflow involves pushing OTA updates using CodePush, you'll need to have an account setup for CodePush.

### What about React Native ?

You don't need to have React Native installed on your machine. If you have it already installed, that's great--it's not really a problem. The same applies for Yarn and CodePush.

