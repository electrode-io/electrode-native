While the recommended approach to implement Electrode Native APIs is to do so in a dedicated standalone project, favoring reuse and low coupling, it might not be possible in your context to implement a standalone API.\
For example if your native API implementation is dependent on the mobile application code itself, it might be needed to write the API implementation directly inside the mobile applicatiosn codebase.\
While this is possible, we don't recommend this tight coupling approach, and if possible, you should favor a standalone implementation.

Generated standalone API implementations have the following naming convention: `react-native-[name]-api-impl`
