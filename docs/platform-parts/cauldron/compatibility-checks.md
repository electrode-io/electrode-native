Any MiniApp that needs to be added to a mobile application version stored in the cauldron will go through a series of version compatibility checks. If any of these checks fails, the MiniApp won't be added to the cauldron _(and ultimately won't be included in a new Container or shipped as an OTA update)_.

The Cauldron performs compatibility checks to make sure that any MiniApp added to a mobile application version, will not lead to runtime issues with other MiniApps and native dependencies already part of the container of the mobile application version.

The compatibility checks are primarily checking the native dependency versions proper alignment _(including React Native and any native module or API / API implementation that the MiniApp uses)_.

Listed below are some of the compatibility checks and logic that is performed by Electrode Native, when running an operation changing the state of a container.

### Adding or updating a MiniApp

- To a in-development mobile application version\
  For each of the native dependencies that the MiniApp depends on:\
   - Don't do anything if the native dependency is already in the Container, with the same version.
   - If the native dependency is not already in the Container, add it.
   - If the native dependency is already in the Container but with a different version, ensure that the versions are backward compatible _(for third-party native modules we don't consider backward compatibility, the platform requires an exact version match, however APIs follow more flexible rules)_. If that is the case and the version of the dependency used by the MiniApp is greater than the one in the Container, bump the version of the dependency in the container to the one used by the MiniApp. If that is not the case, fail the operation.

- To a released mobile application version

  For each of the native dependencies that the MiniApp depends on:\
  - Nothing to do if the native dependency is already in the Container, using the same version.
  - If the native dependency is not already in the Container, fail the operation. It is not possible to add a native dependency using OTA updates (for third-party native modules we don't consider backward compatibility, the platform requires an exact version match, whereas APIs follow more flexible rules). If that is the case and the version of the dependency used by the MiniApp is lower than the one in the Container, proceed. Otherwise, fail.

###  Removing a MiniApp
  Compatibility checks are not performed and Electrode Native does not try to remove any of the native dependencies used by the MiniApp.
