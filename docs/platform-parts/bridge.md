## Electrode Native Bridge

The Electrode Native bridge is a low-level bi-directional communication library used to simplify communication between the JavaScript and the native mobile application. It is not part of the Electrode Native repository itself--it resides in it's own [GitHub repository](https://github.com/electrode-io/react-native-electrode-bridge). The Electrode Native bridge is actually a React Native-native module and as with most native modules, it contains some JavaScript code as well as iOS and Android platform code. Most of the Electrode Native bridge code is native (95% native/5% JavaScript).

Communication through the Electrode Native bridge is based on message exchanges between JavaScript and the Native mobile application. The Electrode Native bridge processes three message types: `Request`, `Response`, and `Event`.

### Electrode Native bridge messages types

- Request  
A Request message is used to request data from a receiver or to request an action to be performed by a receiver. A Request message always results in an associated response message that can contain either the requested data or indicate the result of an action. A Request message can optionally contain a payload. For any given Request message type, there can be only one associated receiver. The receiver handles the request and issues a response message. From a developer perspective, a Request message can be thought as being a method call.

- Response
A Response message is the result of a single Request message. A Response message can optionally contain a payload. From a developer perspective, a Response message can be thought as the return value of a method. The value can be of a specific type or not (void).

- Event  
An Event message is a "fire and forget" message. The sender of the Event message does not expect a response --so the receiver is known as a listener. Unlike a Request message, an Event message can be sent to multiple listeners. All registered listeners (on JavaScript side and native side) for a specific event message type will receive the Event message.

### Electrode Native bridge communication

The Electrode Native Bridge expose a public client surface that is consistent across all three platforms and allows requests and responses from any side:

- Send Requests (and associated responses)
- Emit Events
- Register Requests handlers
- Register/Unregister Event listeners

Request and Event messages are named to identify the Request or Event message type. The name is used to direct the messages to the associated receivers. For example, names for Request messages might be `getMovieById` or `getAllMovies`. And for Event messages, a name might be `movieListUpdated`.

When a Request message is sent from any side, the Electrode Native bridge first attempts to find a registered receiver on the same side from where the message is sent. For example, if the Request message is sent from the JavaScript side, the Electrode Native bridge will first attempt to find a handler for it on the JavaScript side. If a handler is not found on the same side, the Electrode Native bridge will then attempt to find a Register handler on the other side (in this example, the native side). Ultimately if no handler is found, the request will fail with a specific error code.

When an Event message is sent from any side, the Electrode Native bridge looks for all registered listeners for this event type. The Electrode Native bridge then sends the message to all registered listeners for that event type, independent of the side on which they are located.

Payloads for Requests, Responses, or Events can be primitive types, but the Electrode Native bridge also supports complex object payloads (full-fledged model classes).

### Leveraging the Electrode Native bridge using APIs

Even though the Electrode Native bridge is a standalone native module that can be used in your React Native projects (even without Electrode Native), if you are using Electrode Native, you do not directly interact with the Electrode Native bridge in your MiniApps or in your mobile applications. Instead, you'll mostly use Electrode Native APIs that are interacting with the bridge on their own. The Electrode Native APIs are generated from a Swagger schema--so they are predefined. Check out our Electrode Native API documentation.

For more information about the Electrode Native bridge, check out the [react-native-electrode-bridge repository](https://github.com/electrode-io/react-native-electrode-bridge).
