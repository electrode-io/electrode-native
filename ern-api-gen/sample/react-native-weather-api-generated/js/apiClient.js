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
export function refreshWeatherFor(location, dispatchMode = DispatchMode.NATIVE) {
  return electrodeBridge.sendRequest(
    messages.REFRESH_WEATHER_FOR, {
    data: { location },
    dispatchMode
  });
}
export function getTemperatureFor(location, dispatchMode = DispatchMode.NATIVE) {
  return electrodeBridge.sendRequest(
    messages.GET_TEMPERATURE_FOR, {
    data: { location },
    dispatchMode
  });
}
export function getCurrentTemperature(dispatchMode = DispatchMode.NATIVE) {
  return electrodeBridge.sendRequest(
    messages.GET_CURRENT_TEMPERATURE, {
    dispatchMode
  });
}
export function getCurrentLocations(dispatchMode = DispatchMode.NATIVE) {
  return electrodeBridge.sendRequest(
    messages.GET_CURRENT_LOCATIONS, {
    dispatchMode
  });
}
export function getLocation(dispatchMode = DispatchMode.NATIVE) {
  return electrodeBridge.sendRequest(
    messages.GET_LOCATION, {
    dispatchMode
  });
}
export function setLocation(location, dispatchMode = DispatchMode.NATIVE) {
  return electrodeBridge.sendRequest(
    messages.SET_LOCATION, {
    data: { location },
    dispatchMode
  });
}
