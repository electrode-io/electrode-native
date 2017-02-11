package com.walmartlabs.ern.weather.api;

import android.os.Bundle;
import android.os.Parcelable;
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

  //====================================================================
  // Events listener registration (Public client surface)
  //====================================================================

  public static void onWeatherUpdated(EventListener listener) {
      sWeatherUpdatedListeners.add(listener);
    }
  public static void onWeatherUdpatedAtLocation(EventListener<String> listener) {
      sWeatherUdpatedAtLocationListeners.add(listener);
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
           Integer payload = bundle.getInt("rsp");
           response.onSuccess(payload);
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
           Integer payload = bundle.getInt("rsp");
           response.onSuccess(payload);
       }

       @Override
       public void onError(String code, String message) {
           response.onError(code, message);
       }
     });
  }
  public static void getCurrentLocations(
                                final Response<String[]> response) {
    getCurrentLocations( response, DispatchMode.JS);
  }

  public static void getCurrentLocations(
                                final Response<String[]> response,
                                final DispatchMode dispatchMode) {
    
     ElectrodeBridgeRequest req = new ElectrodeBridgeRequest.Builder(Names.GET_CURRENT_LOCATIONS)
                       
                                      .withDispatchMode(dispatchMode)
                                      .build();

     ElectrodeBridge.sendRequest(req, new RequestCompletionListener() {
       @Override
       public void onSuccess(Bundle bundle) {
           String[] payload = bundle.getStringArray("rsp");
           response.onSuccess(payload);
       }

       @Override
       public void onError(String code, String message) {
           response.onError(code, message);
       }
     });
  }
  public static void getLocation(
                                final Response<LatLng> response) {
    getLocation( response, DispatchMode.JS);
  }

  public static void getLocation(
                                final Response<LatLng> response,
                                final DispatchMode dispatchMode) {
    
     ElectrodeBridgeRequest req = new ElectrodeBridgeRequest.Builder(Names.GET_LOCATION)
                       
                                      .withDispatchMode(dispatchMode)
                                      .build();

     ElectrodeBridge.sendRequest(req, new RequestCompletionListener() {
       @Override
       public void onSuccess(Bundle bundle) {
           LatLng payload = LatLng.fromBundle(bundle);
           response.onSuccess(payload);
       }

       @Override
       public void onError(String code, String message) {
           response.onError(code, message);
       }
     });
  }
  public static void setLocation(final LatLng location,
                                final Response response) {
    setLocation(location, response, DispatchMode.JS);
  }

  public static void setLocation(final LatLng location,
                                final Response response,
                                final DispatchMode dispatchMode) {
    Bundle bundle = location.toBundle();
     ElectrodeBridgeRequest req = new ElectrodeBridgeRequest.Builder(Names.SET_LOCATION)
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
         Object payload = null;
         listener.onEvent(payload);
       }
      }
    });
    ElectrodeBridge.registerEventListener(Names.WEATHER_UDPATED_AT_LOCATION, new EventDispatcherImpl.EventListener() {
      @Override
      public void onEvent(@NonNull Bundle bundle) {
       for (EventListener<String> listener : sWeatherUdpatedAtLocationListeners) {
         String payload = bundle.getString("location");
         listener.onEvent(payload);
       }
      }
    });
  }
}
