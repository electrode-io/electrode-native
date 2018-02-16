## complete native application descriptor

A complete native application descriptor is a string with format `[nativeAppName]:[platform]:[version]` 
- `nativeAppName` : alphanumeric native application name , cannot contain character ':'
- `platform` : one of `android` or `ios`
- `version` : alphanumeric , cannot contain character ':'

## partial native application descriptor

A partial native application descriptor is a string with format `[nativeAppName]`, `platform` and `version` can remain optional. 
- `nativeAppName` : alphanumeric native application name , cannot contain character ':'

## Electrode Native module name

The Electrode Native module name applies to modules created with Electrode Native cli.
- Electrode Native recommends module name must only contain upper and/or lower case letters. 
- `create-miniapp`, `create-api` and `create-api-impl` commands allow passing Electrode Native module name as it's arguments.

## package path

A package path is a string representing the path (local or remote) to a Node Package. In the context of Electrode Native, a few package path formats are supported (as illustrated by the following samples) :

Package in git repository on network:

- `git+ssh://git@github.com:electrode-io/MovieListMiniApp.git`
- `git+ssh://git@github.com:electrode-io/MovieListMiniApp.git#0.0.9`
- `https://github.com/electrode-io/MovieListMiniApp.git`
- `https://github.com/electrode-io/MovieListMiniApp.git#0.0.9`

Package on local harddisk:

- `file:/Users/blemair/Code/MovieListMiniApp`
- `/Users/blemair/Code/MovieListMiniApp`

Package on npm repository on network:

- `movielistminiapp`
- `movielistminiapp@0.0.9`
- `@myscope/movielistminiapp@0.0.9`
