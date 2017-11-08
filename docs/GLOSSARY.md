## complete native application descriptor

A complete native application descriptor is a string with format `[nativeAppName]:[platform]:[version]` 
- `nativeAppName` : alphanumeric native application name , cannot contain character ':'
- `platform` : one of `android` or `ios`
- `version` : alphanumeric , cannot contain character ':'

## partial native application descriptor

A partial native application descriptor is a string with format `[nativeAppName]`, `plaform` and `version` can remain optional. 
- `nativeAppName` : alphanumeric native application name , cannot contain character ':'

## Electrode Native module name
The Electrode Native module name applies to modules created with Electrode Native cli.
- Electrode Native recommends module name must only contain upper and/or lower case letters. 
- `create-miniapp`, `create-api` and `create-api-impl` commands allow passing Electrode Native module name as it's arguments.