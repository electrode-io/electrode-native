package com.walmartlabs.ern.weather.api;

import android.support.annotation.NonNull;

import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgeEventListener;
import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgeRequestHandler;
import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgeResponseListener;
import com.walmartlabs.electrode.reactnative.bridge.FailureMessage;
import com.walmartlabs.electrode.reactnative.bridge.None;
import com.walmartlabs.ern.weather.model.LatLng;

public final class WeatherApi {
  private static final Requests REQUESTS;
  private static final Events EVENTS;

  static {
    REQUESTS = new WeatherRequests();
    EVENTS = new WeatherEvents();
  }

  private WeatherApi() {}

  @NonNull
  public static Requests requests() {
    return REQUESTS;
  }

  @NonNull
  public static Events events() {
    return EVENTS;
  }

  public interface Events {
    String WEATHER_UPDATED = "com.walmartlabs.ern.weather.weather.updated";
    String WEATHER_UDPATED_AT_LOCATION = "com.walmartlabs.ern.weather.weather.udpated.at.location";

    void addWeatherUpdatedEventListener(@NonNull final ElectrodeBridgeEventListener<None> eventListener);
    void emitWeatherUpdatedEvent();
    void addWeatherUdpatedAtLocationEventListener(@NonNull final ElectrodeBridgeEventListener<String> eventListener);
    void emitWeatherUdpatedAtLocationEvent(@NonNull String location);
  }

  public interface Requests {
    String REFRESH_WEATHER = "com.walmartlabs.ern.weather.refresh.weather";
    String REFRESH_WEATHER_FOR = "com.walmartlabs.ern.weather.refresh.weather.for";
    String GET_TEMPERATURE_FOR = "com.walmartlabs.ern.weather.get.temperature.for";
    String GET_CURRENT_TEMPERATURE = "com.walmartlabs.ern.weather.get.current.temperature";
    String GET_CURRENT_LOCATIONS = "com.walmartlabs.ern.weather.get.current.locations";
    String GET_LOCATION = "com.walmartlabs.ern.weather.get.location";
    String SET_LOCATION = "com.walmartlabs.ern.weather.set.location";

   void registerRefreshWeatherRequestHandler(@NonNull final ElectrodeBridgeRequestHandler<None, None> handler);
   void refreshWeather(@NonNull final ElectrodeBridgeResponseListener<None> responseListener);
   void registerRefreshWeatherForRequestHandler(@NonNull final ElectrodeBridgeRequestHandler<String, None> handler);
   void refreshWeatherFor(@NonNull String location, @NonNull final ElectrodeBridgeResponseListener<None> responseListener);
   void registerGetTemperatureForRequestHandler(@NonNull final ElectrodeBridgeRequestHandler<String, Integer> handler);
   void getTemperatureFor(@NonNull String location, @NonNull final ElectrodeBridgeResponseListener<Integer> responseListener);
   void registerGetCurrentTemperatureRequestHandler(@NonNull final ElectrodeBridgeRequestHandler<None, Integer> handler);
   void getCurrentTemperature(@NonNull final ElectrodeBridgeResponseListener<Integer> responseListener);
   void registerGetCurrentLocationsRequestHandler(@NonNull final ElectrodeBridgeRequestHandler<None, String[]> handler);
   void getCurrentLocations(@NonNull final ElectrodeBridgeResponseListener<String[]> responseListener);
   void registerGetLocationRequestHandler(@NonNull final ElectrodeBridgeRequestHandler<None, LatLng> handler);
   void getLocation(@NonNull final ElectrodeBridgeResponseListener<LatLng> responseListener);
   void registerSetLocationRequestHandler(@NonNull final ElectrodeBridgeRequestHandler<LatLng, None> handler);
   void setLocation(@NonNull LatLng location, @NonNull final ElectrodeBridgeResponseListener<None> responseListener);
  }
}
