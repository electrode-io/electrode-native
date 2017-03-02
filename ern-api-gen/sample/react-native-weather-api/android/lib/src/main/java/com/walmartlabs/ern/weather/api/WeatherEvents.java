package com.walmartlabs.ern.weather.api;

import android.support.annotation.NonNull;

import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgeEventListener;
import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgeHolder;
import com.walmartlabs.electrode.reactnative.bridge.EventListenerProcessor;
import com.walmartlabs.electrode.reactnative.bridge.EventProcessor;
import com.walmartlabs.electrode.reactnative.bridge.None;
import com.walmartlabs.ern.weather.model.LatLng;

final class WeatherEvents implements WeatherApi.Events {
  WeatherEvents() {}

  @Override
  public void addWeatherUpdatedEventListener(@NonNull final ElectrodeBridgeEventListener<None> eventListener) {
    new EventListenerProcessor<>(WEATHER_UPDATED, None.class, eventListener).execute();
  }

  @Override
  public void emitWeatherUpdatedEvent() {
    new EventProcessor<>(WEATHER_UPDATED, null).execute();
  }
  @Override
  public void addWeatherUdpatedAtLocationEventListener(@NonNull final ElectrodeBridgeEventListener<String> eventListener) {
    new EventListenerProcessor<>(WEATHER_UDPATED_AT_LOCATION, String.class, eventListener).execute();
  }

  @Override
  public void emitWeatherUdpatedAtLocationEvent(@NonNull String location) {
    new EventProcessor<>(WEATHER_UDPATED_AT_LOCATION, location).execute();
  }
}
