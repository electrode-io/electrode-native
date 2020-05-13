The [Electrode Native Bridge] expose a public client surface that is consistent across all three platforms and allows requests and responses from any side:

- Send Requests (and associated responses)
- Emit Events
- Register Requests handlers
- Register/Unregister Event listeners

Request and Event messages are named to identify the Request or Event message type. The name is used to direct the messages to the associated receivers. For example, names for Request messages might be `getMovieById` or `getAllMovies`. And for Event messages, a name might be `movieListUpdated`.

When a Request message is sent from any side, the Electrode Native bridge first attempts to find a registered receiver on the same side from where the message is sent. For example, if the Request message is sent from the JavaScript side, the Electrode Native bridge will first attempt to find a handler for it on the JavaScript side. If a handler is not found on the same side, the Electrode Native bridge will then attempt to find a Register handler on the other side (in this example, the native side). Ultimately if no handler is found, the request will fail with a specific error code.

When an Event message is sent from any side, the Electrode Native bridge looks for all registered listeners for this event type. The Electrode Native bridge then sends the message to all registered listeners for that event type, independent of the side on which they are located.

Payloads for Requests, Responses, or Events can be primitive types, but the Electrode Native bridge also supports complex object payloads (full-fledged model classes).

[electrode native bridge]: https://github.com/electrode-io/react-native-electrode-bridge
