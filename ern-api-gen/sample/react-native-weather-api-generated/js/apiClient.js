import { electrodeBridge, DispatchMode } from '@walmart/react-native-electrode-bridge';
import * as messages from "./messages.js";

//====================================================================
// Events listeners registration
//====================================================================

export function onWeatherUpdated(handler) {
  electrodeBridge.registerEventListener(messages.WEATHER_UPDATED, weatherUpdatedHandler);
}
export function onWeatherUdpatedAtLocation(handler) {
  electrodeBridge.registerEventListener(messages.WEATHER_UDPATED_AT_LOCATION, weatherUdpatedAtLocationHandler);
}
export function onWeatherUpdatedAtPosition(handler) {
  electrodeBridge.registerEventListener(messages.WEATHER_UPDATED_AT_POSITION, weatherUpdatedAtPositionHandler);
}

//====================================================================
// Requests sending
//====================================================================

// Todo : Correctly generate code for request payload / response payload
// support
export function refreshWeather(dispatchMode = DispatchMode.NATIVE) {
  return electrodeBridge.sendRequest(
    messages.REFRESH_WEATHER, {
    dispatchMode
  });
}
export function refreshWeatherFor(dispatchMode = DispatchMode.NATIVE) {
  return electrodeBridge.sendRequest(
    messages.REFRESH_WEATHER_FOR, {
    dispatchMode
  });
}
export function getTemperatureFor(dispatchMode = DispatchMode.NATIVE) {
  return electrodeBridge.sendRequest(
    messages.GET_TEMPERATURE_FOR, {
    dispatchMode
  });
}
export function getCurrentTemperature(dispatchMode = DispatchMode.NATIVE) {
  return electrodeBridge.sendRequest(
    messages.GET_CURRENT_TEMPERATURE, {
    dispatchMode
  });
}
