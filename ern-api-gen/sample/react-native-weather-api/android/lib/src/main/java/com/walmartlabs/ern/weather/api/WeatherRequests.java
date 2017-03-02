package com.walmartlabs.ern.weather.api;

import android.support.annotation.NonNull;

import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgeHolder;
import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgeRequestHandler;
import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgeResponseListener;
import com.walmartlabs.electrode.reactnative.bridge.None;
import com.walmartlabs.electrode.reactnative.bridge.RequestHandlerProcessor;
import com.walmartlabs.electrode.reactnative.bridge.RequestProcessor;
import com.walmartlabs.ern.weather.model.LatLng;

final class WeatherRequests implements WeatherApi.Requests {
  WeatherRequests() {}

  @Override
  public void registerRefreshWeatherRequestHandler(@NonNull final ElectrodeBridgeRequestHandler<None, None> handler) {
    new RequestHandlerProcessor<>(REFRESH_WEATHER, None.class, None.class, handler).execute();
  }

  @Override
  public void refreshWeather(@NonNull final ElectrodeBridgeResponseListener<None> responseListener) {
    new RequestProcessor<>(REFRESH_WEATHER, null, None.class, responseListener).execute();
  }
  @Override
  public void registerRefreshWeatherForRequestHandler(@NonNull final ElectrodeBridgeRequestHandler<String, None> handler) {
    new RequestHandlerProcessor<>(REFRESH_WEATHER_FOR, String.class, None.class, handler).execute();
  }

  @Override
  public void refreshWeatherFor(@NonNull String location, @NonNull final ElectrodeBridgeResponseListener<None> responseListener) {
    new RequestProcessor<>(REFRESH_WEATHER_FOR, location, None.class, responseListener).execute();
  }
  @Override
  public void registerGetTemperatureForRequestHandler(@NonNull final ElectrodeBridgeRequestHandler<String, Integer> handler) {
    new RequestHandlerProcessor<>(GET_TEMPERATURE_FOR, String.class, Integer.class, handler).execute();
  }

  @Override
  public void getTemperatureFor(@NonNull String location, @NonNull final ElectrodeBridgeResponseListener<Integer> responseListener) {
    new RequestProcessor<>(GET_TEMPERATURE_FOR, location, Integer.class, responseListener).execute();
  }
  @Override
  public void registerGetCurrentTemperatureRequestHandler(@NonNull final ElectrodeBridgeRequestHandler<None, Integer> handler) {
    new RequestHandlerProcessor<>(GET_CURRENT_TEMPERATURE, None.class, Integer.class, handler).execute();
  }

  @Override
  public void getCurrentTemperature(@NonNull final ElectrodeBridgeResponseListener<Integer> responseListener) {
    new RequestProcessor<>(GET_CURRENT_TEMPERATURE, null, Integer.class, responseListener).execute();
  }
  @Override
  public void registerGetCurrentLocationsRequestHandler(@NonNull final ElectrodeBridgeRequestHandler<None, String[]> handler) {
    new RequestHandlerProcessor<>(GET_CURRENT_LOCATIONS, None.class, String[].class, handler).execute();
  }

  @Override
  public void getCurrentLocations(@NonNull final ElectrodeBridgeResponseListener<String[]> responseListener) {
    new RequestProcessor<>(GET_CURRENT_LOCATIONS, null, String[].class, responseListener).execute();
  }
  @Override
  public void registerGetLocationRequestHandler(@NonNull final ElectrodeBridgeRequestHandler<None, LatLng> handler) {
    new RequestHandlerProcessor<>(GET_LOCATION, None.class, LatLng.class, handler).execute();
  }

  @Override
  public void getLocation(@NonNull final ElectrodeBridgeResponseListener<LatLng> responseListener) {
    new RequestProcessor<>(GET_LOCATION, null, LatLng.class, responseListener).execute();
  }
  @Override
  public void registerSetLocationRequestHandler(@NonNull final ElectrodeBridgeRequestHandler<LatLng, None> handler) {
    new RequestHandlerProcessor<>(SET_LOCATION, LatLng.class, None.class, handler).execute();
  }

  @Override
  public void setLocation(@NonNull LatLng location, @NonNull final ElectrodeBridgeResponseListener<None> responseListener) {
    new RequestProcessor<>(SET_LOCATION, location, None.class, responseListener).execute();
  }
}
