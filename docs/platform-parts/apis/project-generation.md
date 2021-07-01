Electrode Native automatically generates APIs based on a Swagger schema. The generated API results in a cross platform API project that includes the client code of the API, for all three platforms (JS/Android/iOS), along with any optional API models. Any Electrode Native MiniApp or mobile application can then use this Electrode Native API.

The generated API also contains the necessary hooks to implement the API. For example if your movie API defines a `getAllMovies` request, the API project will also contain hooks to write the actual request handling code and return the appropriate response, in this context, the collection of all movies.

The implementation of an API is not part of the API itself. The API project and the API implementation remain separate. One of the reason is to allow multiple implementations for any given API and offer the possibility to switch between implementations.

Once the API is generated, you should not modify it in any way _(unless you plan not to regenerate it later on)_. The API module contains only generated code. Any regeneration of it _(for example, following a schema update)_ will actually overwrite any custom made user code modifications.

Generated APIs have the following naming convention: `react-native-[name]-api`
