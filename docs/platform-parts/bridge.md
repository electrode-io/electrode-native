## Electrode React Native Bridge

The Electrode React Native bridge is a low-level bi-directional communication library used to simplify communication between the JavaScript and the native mobile application. It is not part of the ERN platform itself--it resides in it's own open source GitHub repository [URL HERE]. The ERN bridge is actually a React Native-native module and as with most native modules, it contains some JavaScript code as well as iOS and Android platform code. Most of the ERN bridge code is native (95% native/5% Javascript).

Communication through the ERN bridge is based on message exchanges between JavaScript and the Native mobile application. The ERN bridge processes three message types: Request, Response, and Events.

### ERN bridge messages types

- Request  
A Request message is used to request data from a receiver or to request an action to be perfomed by a receiver. A Request message always results in an associated response message that can contain either the requested data or indicate the result of an action. A Request message can optionally contain a payload. For any given Request message type, there can be only one associated receiver. The receiver handles the request and issues a response message. From a developer perspective, a Request message is a method call.

- Response
A Response message is the result of a single Request message. A Response message can optionaly contain a payload.  From a developer perspective, a Response message is the return value of a method. The value can be of a specific type or not (void).

- Event  
An Event message is a "fire and forget" message. The sender of the Event message does not expect a response --so the receiver is known as a listener. Unlike a Request message, an Event message can be sent to multiple listeners. All registered listeners for a specific event message type receive the Event message.

### ERN bridge communication

The ERN Bridge uses a public client that is consistent across all three platforms and allows requests and responses from any side:

- Send Requests (and responses)
- Emit Events
- Register Requests handlers
- Register/Unregister Event listeners

Request and Event messages are named to identify the Request or Event message type. The name is used to direct the messages to the associated receivers. For example, names for Request messages might be `getMovieById` or `getAllMovies`. And for Event messages, a name might be `movieListUpdated`.

When a Request message is sent from any side, the ERN bridge first attempts to find a registered receiver (using the Request handler) on the same side of the message. For example, if the Request message is sent from the JavaScript side, the ERN bridge attempts to find a handler on the JavaScript side. If a handler is not found on the same side, the ERN bridge then attempts to find a Register handler on the other side (in this example, the native side). If a handler is not found, the request fails.

When an Event message is sent from any side, the ERN bridge finds all registered listeners for the message type. The ERN bridge sends the message to all registered listeners for that type, independent of the side on which they are located.

Payloads for Requests, Responses, or Events can be primitive types, but the ERN bridge also supports complex object payloads (fully-fledged model classes).

### Leveraging the ERN bridge using APIs

Even though the ERN bridge is a standalone native module that can be used in your React Native projects (even without Electrode React Native), if you are using ERN, you do not directly interact with the ERN bridge in your MiniApps or in your mobile applications. Instead, you use the ERN APIs to make a call to the ERN bridge. The ERN APIs are generated from a Swagger schema--so they are predefined. Check out our ERN API documentation HERE.

Because the ERN bridge is a library that is not shipped with the ERN platform, ERN CLI commands are not used to communicate with the ERN bridge.

For more information about the ERN bridge, check out the internal documentation stored within its repository. [URL HERE]
