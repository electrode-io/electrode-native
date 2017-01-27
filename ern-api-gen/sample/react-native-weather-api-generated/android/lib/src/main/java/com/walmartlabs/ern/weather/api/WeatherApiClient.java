package com.walmartlabs.ern.weather.api;

import android.os.Bundle;
import android.support.annotation.NonNull;

import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridge;
import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgeRequest;
import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgeRequest.DispatchMode;
import com.walmartlabs.electrode.reactnative.bridge.EventDispatcherImpl;
import com.walmartlabs.electrode.reactnative.bridge.RequestCompletionListener;
import com.walmartlabs.electrode.reactnative.bridge.helpers.EventListener;
import com.walmartlabs.electrode.reactnative.bridge.helpers.Response;
import com.walmartlabs.ern.weather.model.LatLng;
import java.util.Collections;
import java.util.HashMap;
import java.util.Set;

public final class WeatherApiClient {

  //====================================================================
  // Events listeners for each event name (Private)
  //====================================================================

  private static Set<EventListener> sWeatherUpdatedListeners =
          Collections.newSetFromMap(new HashMap<EventListener, Boolean>());
  private static Set<EventListener<String>> sWeatherUdpatedAtLocationListeners =
          Collections.newSetFromMap(new HashMap<EventListener<String>, Boolean>());
  private static Set<EventListener<LatLng>> sWeatherUpdatedAtPositionListeners =
          Collections.newSetFromMap(new HashMap<EventListener<LatLng>, Boolean>());

  //====================================================================
  // Events listener registration (Public client surface)
  //====================================================================

  public static void onWeatherUpdated(EventListener listener) {
      sWeatherUpdatedListeners.add(listener);
    }
  public static void onWeatherUdpatedAtLocation(EventListener<String> listener) {
      sWeatherUdpatedAtLocationListeners.add(listener);
    }
  public static void onWeatherUpdatedAtPosition(EventListener<LatLng> listener) {
      sWeatherUpdatedAtPositionListeners.add(listener);
    }

  //====================================================================
  // Requests sending (Public client surface)
  //====================================================================

  public static void refreshWeather(
                                final Response response) {
    refreshWeather( response, DispatchMode.JS);
  }

  public static void refreshWeather(
                                final Response response,
                                final DispatchMode dispatchMode) {
    
     ElectrodeBridgeRequest req = new ElectrodeBridgeRequest.Builder(Names.REFRESH_WEATHER)
                       
                                      .withDispatchMode(dispatchMode)
                                      .build();

     ElectrodeBridge.sendRequest(req, new RequestCompletionListener() {
       @Override
       public void onSuccess(Bundle bundle) {
           response.onSuccess(null);
       }

       @Override
       public void onError(String code, String message) {
           response.onError(code, message);
       }
     });
  }
  public static void refreshWeatherFor(final String location,
                                final Response response) {
    refreshWeatherFor(location, response, DispatchMode.JS);
  }

  public static void refreshWeatherFor(final String location,
                                final Response response,
                                final DispatchMode dispatchMode) {
    Bundle bundle = new Bundle(); bundle.putString("location",                   location);
     ElectrodeBridgeRequest req = new ElectrodeBridgeRequest.Builder(Names.REFRESH_WEATHER_FOR)
                       .withData(bundle)
                                      .withDispatchMode(dispatchMode)
                                      .build();

     ElectrodeBridge.sendRequest(req, new RequestCompletionListener() {
       @Override
       public void onSuccess(Bundle bundle) {
           response.onSuccess(null);
       }

       @Override
       public void onError(String code, String message) {
           response.onError(code, message);
       }
     });
  }
  public static void getTemperatureFor(final String location,
                                final Response<Integer> response) {
    getTemperatureFor(location, response, DispatchMode.JS);
  }

  public static void getTemperatureFor(final String location,
                                final Response<Integer> response,
                                final DispatchMode dispatchMode) {
    Bundle bundle = new Bundle(); bundle.putString("location",                   location);
     ElectrodeBridgeRequest req = new ElectrodeBridgeRequest.Builder(Names.GET_TEMPERATURE_FOR)
                       .withData(bundle)
                                      .withDispatchMode(dispatchMode)
                                      .build();

     ElectrodeBridge.sendRequest(req, new RequestCompletionListener() {
       @Override
       public void onSuccess(Bundle bundle) {
           response.onSuccess(bundle.getInt("rsp"));
       }

       @Override
       public void onError(String code, String message) {
           response.onError(code, message);
       }
     });
  }
  public static void getCurrentTemperature(
                                final Response<Integer> response) {
    getCurrentTemperature( response, DispatchMode.JS);
  }

  public static void getCurrentTemperature(
                                final Response<Integer> response,
                                final DispatchMode dispatchMode) {
    
     ElectrodeBridgeRequest req = new ElectrodeBridgeRequest.Builder(Names.GET_CURRENT_TEMPERATURE)
                       
                                      .withDispatchMode(dispatchMode)
                                      .build();

     ElectrodeBridge.sendRequest(req, new RequestCompletionListener() {
       @Override
       public void onSuccess(Bundle bundle) {
           response.onSuccess(bundle.getInt("rsp"));
       }

       @Override
       public void onError(String code, String message) {
           response.onError(code, message);
       }
     });
  }
  public static void getCurrentTemperatures(
                                final Response<Integer[]> response) {
    getCurrentTemperatures( response, DispatchMode.JS);
  }

  public static void getCurrentTemperatures(
                                final Response<Integer[]> response,
                                final DispatchMode dispatchMode) {
    
     ElectrodeBridgeRequest req = new ElectrodeBridgeRequest.Builder(Names.GET_CURRENT_TEMPERATURES)
                       
                                      .withDispatchMode(dispatchMode)
                                      .build();

     ElectrodeBridge.sendRequest(req, new RequestCompletionListener() {
       @Override
       public void onSuccess(Bundle bundle) {
           response.onSuccess(bundle.getIntArray("rsp"));
       }

       @Override
       public void onError(String code, String message) {
           response.onError(code, message);
       }
     });
  }

  //====================================================================
  // Bridge initialization
  //====================================================================

  static {
    //====================================================================
    // Registration of event handlers with bridge
    //====================================================================

    ElectrodeBridge.registerEventListener(Names.WEATHER_UPDATED, new EventDispatcherImpl.EventListener() {
      @Override
      public void onEvent(@NonNull Bundle bundle) {
       for (EventListener listener : sWeatherUpdatedListeners) {
         listener.onEvent(null);
       }
      }
    });
    ElectrodeBridge.registerEventListener(Names.WEATHER_UDPATED_AT_LOCATION, new EventDispatcherImpl.EventListener() {
      @Override
      public void onEvent(@NonNull Bundle bundle) {
       for (EventListener<String> listener : sWeatherUdpatedAtLocationListeners) {
         listener.onEvent(bundle.getString("location"));
       }
      }
    });
    ElectrodeBridge.registerEventListener(Names.WEATHER_UPDATED_AT_POSITION, new EventDispatcherImpl.EventListener() {
      @Override
      public void onEvent(@NonNull Bundle bundle) {
       for (EventListener<LatLng> listener : sWeatherUpdatedAtPositionListeners) {
         listener.onEvent(LatLng.fromBundle(bundle));
       }
      }
    });
  }
}
