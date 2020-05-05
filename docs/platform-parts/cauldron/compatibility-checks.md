Any MiniApp or native dependency that needs to be added to a mobile application version stored in the cauldron will go through a series of version compatibility checks. If any of these checks fails, the MiniApp or dependency won't be added to the cauldron (and ultimately won't be included in a new Container or shipped as an OTA update). This is one of the reason not to modify the cauldron repository manually as it results in bypassing compatibility checks.

The Cauldron performs compatibility checks to make sure that any MiniApp or native dependency version added to a mobile application version, will not lead to runtime issues with other MiniApps and dependencies already part of the container of the mobile application.

The compatibility checks are primarily checking the native dependency versions proper alignment--React Native and any native module or API / API implementation that the MiniApp uses.

Listed below are some of the compatibility checks and logic that is performed by Electrode Native, when running an operation changing the state of a container--what it will contain will change, following the operation, or the state of the composite JavaScript bundle will change--in the case of an OTA update using CodePush.

- Adding a new MiniApp
    - To a in-development mobile application version  
For each of the native dependencies included in the MiniApp:
        - Nothing to do if the native dependency is already in the Container, using the same version.
        - If the native dependency is not already in the Container, add it.
        - If the native dependency is already in the Container but with a different version, ensure that the versions are backward compatible (for third-party native modules we don't consider backward compatibility--the platform requires an exact version match, however APIs follow more flexible rules). If that is the case and the version of the dependency used by the MiniApp is greater than the one in the Container, bump the version of the dependency in the container to the one used by the MiniApp. If that is not the case, the process fails.

    - To a released mobile application version
For each of the native dependencies included in the MiniApp:
       - Nothing to do if the native dependency is already in the Container, using the same version.
       - If the native dependency is not already in the Container, fail. It is not possible to add a native dependency using OTA updates (for third-party native modules we don't consider backward compatibility, the platform requires an exact version match, whereas APIs follow more flexible rules). If that is the case and the version of the dependency used by the MiniApp is lower than the one in the Container, proceed. Otherwise, fail.

- Removing a MiniApp  
Compatibility checks are not performed and Electrode Native does not try to remove any of the native dependencies used by the MiniApp.

- Updating a MiniApp version  
Compatibility checks are the same as the checks performed when adding a new MiniApp. See information in the Adding a new MiniApp bullet item above.

When directly adding, updating, or removing native dependencies in a mobile application version, the following applies only for in-development mobile application versions. It is not possible to add, remove, or update a native dependency version using an OTA update.

- Adding a new native dependency
Compatibility checks are not performed. If this is a new native dependency, add it as it won't conflict with existing versions.

- Updating a native dependency version  
Ensure of backward compatibility--only forward version updates are allowed.

- Removing a native dependency  
Verify that there are no MiniApps in the the Container using the native dependency that you want to remove.
