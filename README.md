<h1 align="center">
	<br>
	<img src="https://cdn.rawgit.com/electrode-io/electrode-native/b3b3fcaf/docs/images/electrode-native.png" alt="chalk">
	<br>
  <br>
</h1>

> Electrode Native is a mobile platform that streamlines the integration of React Native components into existing mobile applications. With minimal changes required to the application code base and infrastructure, Electrode Native makes it simpler to leverage React Native potential in any mobile application.

![Current version](https://img.shields.io/npm/v/ern-local-cli.svg?label=current)
[![Coverage Status](https://coveralls.io/repos/github/electrode-io/electrode-native/badge.svg?branch=master&service=github)](https://coveralls.io/github/electrode-io/electrode-native?branch=master&service=github)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![ci][1]][2]

| Test Suite | Status |
| :--- | :--- |
| Unit Tests | [![Unit Tests](https://dev.azure.com/ElectrodeNative/Electrode%20Native/_apis/build/status/electrode-io.electrode-native?branchName=master&stageName=UnitTests)](https://dev.azure.com/ElectrodeNative/Electrode%20Native/_build/latest?definitionId=1&branchName=master) |
| System Tests | [![System Tests](https://dev.azure.com/ElectrodeNative/Electrode%20Native/_apis/build/status/electrode-io.electrode-native?branchName=master&stageName=SystemTests)](https://dev.azure.com/ElectrodeNative/Electrode%20Native/_build/latest?definitionId=1&branchName=master)|

## Getting Started

### Prerequisites

- Node.js >= 10
- npm >= 5.6.0
- Android Studio (for Android apps)
- Xcode >= 10 (for iOS apps)
- CocoaPods (if using a version of React Native >= 0.60)

### Install

```sh
npm install -g electrode-native
```

## Documentation

The [documentation of Electrode Native] is maintained as [GitBook] pages in the [docs](/docs) directory. It is divided into multiple sections:

- An [Overview] of Electrode Native

 This should be read first, as an introduction to learn about [what is Electrode Native] or [what is a MiniApp]. This section also contains some documentation regarding the [Electrode Native workflow], native dependencies management or JS/Native communication.

- A Platform Reference section

 This section covers each Electrode Native module in depth, such as [Container], [Cauldron], [Manifest], [Apis] ...

- A CLI command reference section

 In this section you will find a documentation page for each of the CLI commands available in Electrode Native, for example [create-miniapp], [run-android], [platform use] ...

## Contributing

We embrace contributions, be it documentation, issue reporting, or contributing code.

Please read our [CONTRIBUTING guide](docs/overview/contributing.md) for more details on how to contribute.

## Further Reading

- Check out our [Announcement Blog Post].
- Have a look at the [TechCrunch article].
- See [What is Electrode Native] for more details on Electrode Native.
- Read [Electrode Native Case Study] to learn about key facts.

## License

Copyright 2017 WalmartLabs

Licensed under the [Apache License, Version 2.0].

## Support and Acknowledgment

We'd like to thank our employer, WalmartLabs because we can work on the development of Electrode Native platform as Open Sourced Software for the needs of our internal teams and projects.

We love the public community and the support we get, and we address your requests as much as we can.

We are always excited to get feedback, bug reports, and pull requests.

Thank you.

[react-native]: https://github.com/facebook/react-native

[TechCrunch article]: https://techcrunch.com/2017/09/29/walmart-labs-open-sources-its-tool-for-bringing-react-native-to-existing-mobile-apps/?ncid=mobilenavtrend

[Announcement Blog Post]: https://medium.com/walmartlabs/electrode-native-the-platform-for-integrating-react-native-into-your-apps-129cbabda7b8

[documentation of electrode native]: https://native.electrode.io/

[apache license, version 2.0]: https://www.apache.org/licenses/LICENSE-2.0

[gitbook]: https://www.gitbook.com/

[what is electrode native]: https://native.electrode.io/introduction/what-is-ern/what-is-ern

[overview]: https://native.electrode.io/introduction/what-is-ern

[what is Electrode Native]: https://native.electrode.io/introduction/what-is-ern/what-is-ern

[what is a MiniApp]: https://native.electrode.io/introduction/what-is-ern/what-is-a-miniapp

[Electrode Native workflow]: https://native.electrode.io/introduction/what-is-ern/ern-workflow

[Container]: https://native.electrode.io/reference/index-1

[Cauldron]: https://native.electrode.io/reference/index-2

[Manifest]: https://native.electrode.io/reference/index-3

[apis]: https://native.electrode.io/reference/index-5

[create-miniapp]: https://native.electrode.io/cli-commands/create-miniapp

[run-android]: https://native.electrode.io/cli-commands/run-android

[platform use]: https://native.electrode.io/cli-commands/platform/use

[Electrode Native Case Study]: https://www.walmartlabs.com/case-studies/electrode-native

[CocoaPods]: https://cocoapods.org

[1]: https://github.com/electrode-io/electrode-native/workflows/ci/badge.svg
[2]: https://github.com/electrode-io/electrode-native/actions
