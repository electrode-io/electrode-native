import { electrodeBridge, DispatchMode } from '@walmart/react-native-electrode-bridge';
import * as messages from "./messages.js";

//====================================================================
// Events emition
//====================================================================

  export function weatherUpdated(dispatchMode = DispatchMode.NATIVE) {
    electrodeBridge.emitEvent(messages.WEATHER_UPDATED, {dispatchMode});
  }
  export function weatherUdpatedAtLocation(location, dispatchMode = DispatchMode.NATIVE ) {
    electrodeBridge.emitEvent(messages.WEATHER_UDPATED_AT_LOCATION, {data: { location }, dispatchMode});
  }

//====================================================================
// Request handler registration
//====================================================================

export function handleRefreshWeatherRequest(handler) {
  electrodeBridge.registerRequestHandler(messages.REFRESH_WEATHER,
    (requestData) => {
      return handler(requestData);
    });
}
export function handleRefreshWeatherForRequest(handler) {
  electrodeBridge.registerRequestHandler(messages.REFRESH_WEATHER_FOR,
    (requestData) => {
      return handler(requestData);
    });
}
export function handleGetTemperatureForRequest(handler) {
  electrodeBridge.registerRequestHandler(messages.GET_TEMPERATURE_FOR,
    (requestData) => {
      return handler(requestData);
    });
}
export function handleGetCurrentTemperatureRequest(handler) {
  electrodeBridge.registerRequestHandler(messages.GET_CURRENT_TEMPERATURE,
    (requestData) => {
      return handler(requestData);
    });
}
export function handleGetCurrentLocationsRequest(handler) {
  electrodeBridge.registerRequestHandler(messages.GET_CURRENT_LOCATIONS,
    (requestData) => {
      return handler(requestData);
    });
}
export function handleGetLocationRequest(handler) {
  electrodeBridge.registerRequestHandler(messages.GET_LOCATION,
    (requestData) => {
      return handler(requestData);
    });
}
export function handleSetLocationRequest(handler) {
  electrodeBridge.registerRequestHandler(messages.SET_LOCATION,
    (requestData) => {
      return handler(requestData);
    });
}
