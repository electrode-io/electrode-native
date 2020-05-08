Communication through the Electrode Native bridge is based on message exchanges between JavaScript and the Native mobile application. The Electrode Native bridge processes three message types: `Request`, `Response`, and `Event`.

- Request  
  A Request message is used to request data from a receiver or to request an action to be performed by a receiver. A Request message always results in an associated response message that can contain either the requested data or indicate the result of an action. A Request message can optionally contain a payload. For any given Request message type, there can be only one associated receiver. The receiver handles the request and issues a response message. From a developer perspective, a Request message can be thought as being a method call.

- Response  
  A Response message is the result of a single Request message. A Response message can optionally contain a payload. From a developer perspective, a Response message can be thought as the return value of a method. The value can be of a specific type or not (void).

- Event  
  An Event message is a "fire and forget" message. The sender of the Event message does not expect a response --so the receiver is known as a listener. Unlike a Request message, an Event message can be sent to multiple listeners. All registered listeners (on JavaScript side and native side) for a specific event message type will receive the Event message.
