## Electrode Native Bridge

The Electrode Native bridge is a low-level bi-directional communication library used to simplify communication between the JavaScript and the native mobile application. It is not part of the Electrode Native platform itself--it resides in it's own open source GitHub repository [URL HERE]. The Electrode Native bridge is actually a React Native-native module and as with most native modules, it contains some JavaScript code as well as iOS and Android platform code. Most of the Electrode Native bridge code is native (95% native/5% JavaScript).

Communication through the Electrode Native bridge is based on message exchanges between JavaScript and the Native mobile application. The Electrode Native bridge processes three message types: Request, Response, and Events.

### Electrode Native bridge messages types

- Request  
A Request message is used to request data from a receiver or to request an action to be performed by a receiver. A Request message always results in an associated response message that can contain either the requested data or indicate the result of an action. A Request message can optionally contain a payload. For any given Request message type, there can be only one associated receiver. The receiver handles the request and issues a response message. From a developer perspective, a Request message is a method call.

- Response
A Response message is the result of a single Request message. A Response message can optionally contain a payload.  From a developer perspective, a Response message is the return value of a method. The value can be of a specific type or not (void).

- Event  
An Event message is a "fire and forget" message. The sender of the Event message does not expect a response --so the receiver is known as a listener. Unlike a Request message, an Event message can be sent to multiple listeners. All registered listeners for a specific event message type receive the Event message.

### Electrode Native bridge communication

The Electrode Native Bridge uses a public client that is consistent across all three platforms and allows requests and responses from any side:

- Send Requests (and responses)
- Emit Events
- Register Requests handlers
- Register/Unregister Event listeners

Request and Event messages are named to identify the Request or Event message type. The name is used to direct the messages to the associated receivers. For example, names for Request messages might be `getMovieById` or `getAllMovies`. And for Event messages, a name might be `movieListUpdated`.

When a Request message is sent from any side, the Electrode Native bridge first attempts to find a registered receiver (using the Request handler) on the same side of the message. For example, if the Request message is sent from the JavaScript side, the Electrode Native bridge attempts to find a handler on the JavaScript side. If a handler is not found on the same side, the Electrode Native bridge then attempts to find a Register handler on the other side (in this example, the native side). If a handler is not found, the request fails.

When an Event message is sent from any side, the Electrode Native bridge finds all registered listeners for the message type. The Electrode Native bridge sends the message to all registered listeners for that type, independent of the side on which they are located.

Payloads for Requests, Responses, or Events can be primitive types, but the Electrode Native bridge also supports complex object payloads (fully-fledged model classes).

### Leveraging the Electrode Native bridge using APIs

Even though the Electrode Native bridge is a standalone native module that can be used in your React Native projects (even without Electrode Native), if you are using Electrode Native, you do not directly interact with the Electrode Native bridge in your MiniApps or in your mobile applications. Instead, you use the Electrode Native APIs to make a call to the Electrode Native bridge. The Electrode Native APIs are generated from a Swagger schema--so they are predefined. Check out our Electrode Native API documentation HERE.

Because the Electrode Native bridge is a library that is not shipped with the Electrode Native platform, Electrode Native CLI commands are not used to communicate with the Electrode Native bridge.

For more information about the Electrode Native bridge, check out the internal documentation stored within its repository. [URL HERE]
