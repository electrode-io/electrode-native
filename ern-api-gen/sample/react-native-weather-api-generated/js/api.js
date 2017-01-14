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
  export function weatherUpdatedAtPosition(position, dispatchMode = DispatchMode.NATIVE ) {
    electrodeBridge.emitEvent(messages.WEATHER_UPDATED_AT_POSITION, {data: { position }, dispatchMode});
  }

//====================================================================
// Request handler registration
//====================================================================

export function handleRefreshWeatherRequest(handler) {
  electrodeBridge.registerRequestHandler(messages.REFRESH_WEATHER,
    (requestData) => {
      return handler();
    });
}
export function handleRefreshWeatherForRequest(handler) {
  electrodeBridge.registerRequestHandler(messages.REFRESH_WEATHER_FOR,
    (requestData) => {
      return handler();
    });
}
export function handleGetTemperatureForRequest(handler) {
  electrodeBridge.registerRequestHandler(messages.GET_TEMPERATURE_FOR,
    (requestData) => {
      return handler();
    });
}
export function handleGetCurrentTemperatureRequest(handler) {
  electrodeBridge.registerRequestHandler(messages.GET_CURRENT_TEMPERATURE,
    (requestData) => {
      return handler();
    });
}
