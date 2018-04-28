<h1 align="center">
	<br>
	<img src="https://cdn.rawgit.com/electrode-io/electrode-native/b3b3fcaf/docs/images/electrode-native.png" alt="chalk">
	<br>
  <br>
</h1>

> Electrode Native is a mobile platform that streamlines the integration of React Native components into existing mobile applications. With minimal changes required to the application code base and infrastructure, Electrode Native makes it simpler to leverage React Native potential in any mobile application.

![Current version](https://img.shields.io/npm/v/ern-local-cli.svg?label=current)
[![travis ci](https://travis-ci.org/electrode-io/electrode-native.svg?branch=master)](https://travis-ci.org/electrode-io/electrode-native?branch=master)
[![Coverage Status](https://coveralls.io/repos/github/electrode-io/electrode-native/badge.svg?branch=master&service=github)](https://coveralls.io/github/electrode-io/electrode-native?branch=master&service=github)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

## Getting Started

### Prerequisites

- Node.js >= 6
- NPM >= 3.0
- Android Studio (for Android apps)
- Xcode >=8.3.2 (for iOS apps)

### Install

```console
$ npm install -g electrode-native && ern
```

### Trying it

We have created a [step by step guide], for iOS and Android, to present some of the concepts and features of Electrode Native, through the development of a simple mobile application listing some movies.

## Documentation

The [documentation of Electrode Native] is maintained as [GitBook] pages in the [docs](/docs) directory.  
It is divided into multiple sections :

- An [Overview] of Electrode Native  
This should be read first, as an introduction to learn about [what is Electrode Native] or [what is a MiniApp]. This section also contains some documentation regarding the [Electrode Native workflow], native dependencies management or JS/Native communication.

- A Platform Reference section  
This section covers each Electrode Native module in depth, such as [Container], [Cauldron], [Manifest], [Apis] ...

- A CLI command reference section  
In this section you will find a documentation page for each of the CLI commands available in Electrode Native, for example [create-miniapp], 
[run-android], [platform use] ...

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

[documentation of electrode native]: https://electrode.gitbooks.io/electrode-native/

[Getting Started with Electrode Native]: https://electrode.gitbooks.io/electrode-native/content/getting-started/getting-started.html

[apache license, version 2.0]: https://www.apache.org/licenses/LICENSE-2.0

[gitbook]: https://www.gitbook.com/

[what is electrode native]: https://electrode.gitbooks.io/electrode-native/overview/what-is-ern.html

[step by step guide]: https://electrode.gitbooks.io/electrode-native/getting-started/getting-started.html

[overview]: https://electrode.gitbooks.io/electrode-native/overview/what-is-ern.html

[what is Electrode Native]: https://electrode.gitbooks.io/electrode-native/overview/what-is-ern.html

[what is a MiniApp]: https://electrode.gitbooks.io/electrode-native/overview/what-is-a-miniapp.html

[Electrode Native workflow]: https://electrode.gitbooks.io/electrode-native/overview/ern-workflow.html

[Container]: https://electrode.gitbooks.io/electrode-native/platform-parts/container.html

[Cauldron]: https://electrode.gitbooks.io/electrode-native/platform-parts/cauldron.html

[Manifest]: https://electrode.gitbooks.io/electrode-native/platform-parts/manifest.html

[apis]: https://electrode.gitbooks.io/electrode-native/platform-parts/apis.html

[create-miniapp]: https://electrode.gitbooks.io/electrode-native/cli/create-miniapp.html

[run-android]: https://electrode.gitbooks.io/electrode-native/cli/run-android.html

[platform use]: https://electrode.gitbooks.io/electrode-native/cli/platform/use.html

[Electrode Native Case Study]: https://www.walmartlabs.com/case-studies/electrode-native
