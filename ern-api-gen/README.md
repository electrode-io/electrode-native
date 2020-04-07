# ern-api-gen

This package is part of [Electrode Native][1].

The Electrode Native API Generator creates APIs and models from Swagger specs.

The generated code uses [react-native-electrode-bridge][5] to facilitate
bi-directional message exchange between native code (Android/iOS) and
JavaScript (React Native).

## Usage

See the [documentation][2] and CLI help for more information:

```sh
ern create-api --help
```

## Details

`ern-api-gen` is based on code from the [Swagger][3] project, mainly version
2.X of [Swagger Codegen][4].

### Stock (Swagger) Code Generators

The three primary code generators adapted from Swagger are:

- [`AndroidClientCodegen`](src/languages/AndroidClientCodegen.ts)
- [`JavascriptClientCodegen`](src/languages/JavascriptClientCodegen.ts)
- [`SwiftCodegen`](src/languages/SwiftCodegen.ts)

In line with the main Swagger project, all three classes extend the base class
[`DefaultCodegen`](src/DefaultCodegen.ts).

### Custom (ERN) Code Generators

For the purposes of `ern-api-gen` there are three custom implementations
of API code generators for native code (Java/Swift) and JavaScript:

Codegen | Base Class | Template Folder
--- | --- | ---
`ErnAndroidApiCodegen` | `AndroidClientCodegen` | `resources/android/libraries/ern/`
`ErnES6ApiCodegen` | `ES6Codegen` | `resources/es6/libraries/ern/`
`ErnSwiftCodegen` | `SwiftCodegen` | `resources/swift/libraries/ern/`

Note that `ErnES6ApiCodegen` extends `ES6Codegen`, **not**
`JavascriptClientCodegen` (see next section for details).

### ES6 Generator

The base class of `ErnES6ApiCodegen` is the `ES6Codegen` class which extends
`JavascriptClientCodegen`. `ES6Codegen` uses a different template directory but
otherwise does not change functionality much compared to its base class. It's
important to understand that Swagger does _not_ have a `ES6Codegen` and instead
uses conditionals in `JavascriptClientCodegen` to generate ES6. The ES6
template folder of Swagger differs significantly from the one in `ern-api-gen`.
This is likely due to the fact that ES6 generation was not yet available in
Swagger at the time the initial code was converted for `ern-api-gen`.

## History

Below is a brief summary of the significant events in this module. The
information was mainly obtained from Git logs and by comparing select snapshots
to historic state of [swagger-codegen][4].

### Initial version

The very first version of the content in this folder can be traced back to the
addition of the `ern-message-gen` folder in [`36637761`][9] on **Apr 4, 2017**.

When the code was first added to the repository it had not only
gone through a Java to JavaScript conversion, but also contained other changes
and additions. Some changes in the resource files (e.g. triple curly braces)
may have been a necessity due to subtle differences of the Mustache template
engine in Java, and the [mustache][6] JavaScript package used by `ern-api-gen`.
For these two reasons is it very difficult (or impossible) to determine the
exact state of the Swagger project that was used as the actual "source".

The most accurate approximations point to somewhere between [v2.2.1][7] and
[v2.2.2][8], with most code being closer to `v2.2.1`, while a few files more
closely resemble `v2.2.2`. There are more than 900 commits between the two
tags.

### Rename

`ern-message-gen` was renamed to `ern-api-gen` on **Aug 9, 2017**
([`0f9e0e34`][10]). This fully replaced the previous hull-based generator from
the initial commit.

### TypeScript conversion

A major update (mainly formatting) was done in [8fea575a][11] when the rest of
the Electrode Native code base was converted to TypeScript on **Apr 28, 2018**.

In **May 2019**, the JavaScript sources in `ern-api-gen` were converted to
TypeScript: [92b69b9b][12] (as well as [6d8f166a][13], [2e7d2327][14]).

[1]: https://native.electrode.io/
[2]: https://native.electrode.io/cli-commands/create-api.html
[3]: https://swagger.io/
[4]: https://github.com/swagger-api/swagger-codegen
[5]: https://github.com/electrode-io/react-native-electrode-bridge
[6]: https://www.npmjs.com/package/mustache
[7]: https://github.com/swagger-api/swagger-codegen/releases/tag/v2.2.1
[8]: https://github.com/swagger-api/swagger-codegen/releases/tag/v2.2.2
[9]: https://github.com/electrode-io/electrode-native/commit/36637761224d473baf2f99d6c23dadfe799ed9d6
[10]: https://github.com/electrode-io/electrode-native/commit/0f9e0e34ab720144dcc30158a0e450e4505855bd
[11]: https://github.com/electrode-io/electrode-native/commit/8fea575af1c7fdb76fee2c30e09a5e1d20f898cc
[12]: https://github.com/electrode-io/electrode-native/commit/92b69b9b4ffd74b1ce2113f71a32fcaedabcf314
[13]: https://github.com/electrode-io/electrode-native/commit/6d8f166aac5bba0d4bea1224d49874ef375a26f3
[14]: https://github.com/electrode-io/electrode-native/commit/2e7d23272db2c0783654b921850ce68c6c0f3300
