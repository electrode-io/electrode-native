## Electrode React Native Bridge

The `Bridge` is a low level bi-directional communication library to ease communication between the `JavaScript` side and the `Native` mobile application side.

It is not part of `Electrode React Native` platform itself. Instead it resides in it's own open sourced `GitHub` repository [URL HERE].

`Electrode React Native Bridge` is actually a React Native `native module`. As for most native modules, it contains some `JavaScript` code as well as `iOS` and `Android platform code. Most of the code in our `Bridge` is native (95% native, 5% Javascript).

Communication through the `Bridge` is based on message exchanges between the `JavaScript` side and the `Native` mobile application side. The bridge is built around three different message types.

### Bridge messages types

- `Request`  
A request is a message that can be used to request some data from the receiver or some action to be perfomed by the receiver. A request will always result in an associated response message, which can contain either the request data, or indicate the result of some action. A request can optionaly contain a payload. For any given request message type, there can only be one "receiver" associated to it. This receiver will handle the request and issue a response message back.

From a developer perspective, you can consider a request message as being a method call.

- `Response`
A response message is nothing more than a by-product of a request message. It it associated to a single request message, and can optionaly contains a payload.  

From a developer perspective, you can consider a response message as being the return value of a method. The value can be of a specific type, or not (void).

- `Event`  
An event message is a `fire and forget` message. The emitter of the event message does not expect any kind of response back from the potential receiver(s). At the difference of a request message, an event message can have more than receiver (a.k.a listener). All registered listeners for a specific event message type, will get the message.

### Bridge communication

The `Bridge` expose a public client surface that is cohesive accross all three platforms, and allows to, from any side :

- Send Requests (and get the response back)
- Emit Events
- Register Requests handlers
- Register/Unregister Event listeners

`Request` and `Events` messages have a `name` associated to them. For example, some names for request messages could be `getMovieById`, `getAllMovies`, and for event messages `movieListUpdated`. This name identify the "type" of the request or event message, and is used to direct the messages to the proper receivers.

Whenever a request message is sent from any side, the bridge will first try to find a register receiver (request handler) on the same side for this message (i.e if the request message is sent from the `JavaScript` side, the bridge will try to find an handler for it on the `JavaScript` side). If none is found, the bridge will then acually be crossed to try to find a register handler on the other side of it (`native side` here). If none is found, the request will fail with an error.

Whenever an event message is sent from any side, the bridge will find all register listeners for this message name. It will then send the message to all of them, independtly of the side on which they are located.

Also, payloads for `events`, `requests` or `responses` can be primitive types, but the bridge also comes with support for omplex objects payloads (i.e fully fledge models classes).

### Leveraging the Bridge with APIs

Even though the `Bridge` is a standalone `native module` that can be directly used in your `React Native` projects (even without `Electrode React Native`), if you are using `Electrode React Native`, you will not directly interact with it in your `MiniApps` nor your `mobile applications`. Instead, you will interact with `APIs` that are actually calling into the bridge the way you would do if were to do it directly working with the bridge. `APIs` are fully generated from a `Swagger` schema and spares you from writing all of the plumbing code to interact with the bridge, while also taking care of model generation. Check out our API documentation HERE.

Because `Electrode React Native Bridge` is a library, and is not shipped with the platform, there is actually no `CLI` commands dealing with the bridge.

If you want more technical details on the bridge, you can take a look at its internal documentation stored within its repository. [URL HERE]

