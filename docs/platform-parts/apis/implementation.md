API implementations aren't completely generated for you--for obvious reasons, Electrode Native can't know what your implementation will actually do. However, Electrode Native still generates some of the code to help you kickstart Electrode Native API implementations projects.

An API implementation implements the handling of requests and events from the API. For example, it implements the actual logic behind the `getAllMovies` request. An API implementation is done on one "side" only. For example, an implementation of a given API can be a native implementation (iOS and/or Android) or a JavaScript implementation--but not both. At least not in the same API implementation module.  

There can be multiple implementations for a given API. For example, it is possible to have a JavaScript implementation and a native implementation of the same API. But for any API, only one implementation can be used at runtime.
