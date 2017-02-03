package com.walmartlabs.ern.weather.api;

import android.os.Bundle;

import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridge;
import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgeEvent;
import com.walmartlabs.electrode.reactnative.bridge.RequestDispatcherImpl;
import com.walmartlabs.electrode.reactnative.bridge.ExistingHandlerException;
import com.walmartlabs.electrode.reactnative.bridge.helpers.RequestHandler;
import com.walmartlabs.electrode.reactnative.bridge.helpers.RequestHandlerEx;
import com.walmartlabs.electrode.reactnative.bridge.helpers.Response;
import com.walmartlabs.ern.weather.model.LatLong;

public final class WeatherApi {

  //====================================================================
  // Request Handlers declaration (Private)
  //====================================================================

  private static RequestHandler sRefreshWeatherRequestHandler;
  private static RequestHandlerEx<String,Void> sRefreshWeatherForRequestHandler;
  private static RequestHandlerEx<String,Integer> sGetTemperatureForRequestHandler;
  private static RequestHandler<Integer> sGetCurrentTemperatureRequestHandler;
  private static RequestHandler<String[]> sGetCurrentLocationsRequestHandler;
  private static RequestHandler<LatLong> sGetLocationRequestHandler;
  private static RequestHandlerEx<LatLong,Void> sSetLocationRequestHandler;

  //====================================================================
  // Request Handlers affectation (Public client surface)
  //====================================================================

  public static void handleRefreshWeatherRequest(RequestHandler handler) {
      sRefreshWeatherRequestHandler = handler;
  }
  public static void handleRefreshWeatherForRequest(RequestHandlerEx<String,Void> handler) {
      sRefreshWeatherForRequestHandler = handler;
  }
  public static void handleGetTemperatureForRequest(RequestHandlerEx<String,Integer> handler) {
      sGetTemperatureForRequestHandler = handler;
  }
  public static void handleGetCurrentTemperatureRequest(RequestHandler<Integer> handler) {
      sGetCurrentTemperatureRequestHandler = handler;
  }
  public static void handleGetCurrentLocationsRequest(RequestHandler<String[]> handler) {
      sGetCurrentLocationsRequestHandler = handler;
  }
  public static void handleGetLocationRequest(RequestHandler<LatLong> handler) {
      sGetLocationRequestHandler = handler;
  }
  public static void handleSetLocationRequest(RequestHandlerEx<LatLong,Void> handler) {
      sSetLocationRequestHandler = handler;
  }

  //====================================================================
  // Events emition (Public client surface)
  //====================================================================

  public static void weatherUpdated() {
      weatherUpdated(ElectrodeBridgeEvent.DispatchMode.JS);
  }

  public static void weatherUpdated(final ElectrodeBridgeEvent.DispatchMode dispatchMode) {
      ElectrodeBridge.emitEvent(new ElectrodeBridgeEvent.Builder(Names.WEATHER_UPDATED)
                                     .withDispatchMode(dispatchMode)
                                     .build());
  }
  public static void weatherUdpatedAtLocation(String location) {
      weatherUdpatedAtLocation(location, ElectrodeBridgeEvent.DispatchMode.JS);
  }

  public static void weatherUdpatedAtLocation(String location, final ElectrodeBridgeEvent.DispatchMode dispatchMode) {
      Bundle bundle = new Bundle(); bundle.putString("location",                   location);
      ElectrodeBridge.emitEvent(new ElectrodeBridgeEvent.Builder(Names.WEATHER_UDPATED_AT_LOCATION)
                                     .withDispatchMode(dispatchMode)
                                     .withData(bundle)
                                     .build());
  }

  //====================================================================
  // Bridge initialization
  //====================================================================

  static {
    //====================================================================
    // Registration of request handlers with bridge
    //====================================================================

    ElectrodeBridge.registerRequestHandler(Names.REFRESH_WEATHER, new RequestDispatcherImpl.RequestHandler() {
      @Override
      public void onRequest(Bundle bundle, final RequestDispatcherImpl.RequestCompletioner requestCompletioner) {
        WeatherApi.sRefreshWeatherRequestHandler.handleRequest(new Response<Void>() {
            @Override
            public void onSuccess(Void obj) {
              requestCompletioner.success(null);
            }

            @Override
            public void onError(String code, String message) {
              requestCompletioner.error(code, message);
            }
        });
      }
    });
    ElectrodeBridge.registerRequestHandler(Names.REFRESH_WEATHER_FOR, new RequestDispatcherImpl.RequestHandler() {
      @Override
      public void onRequest(Bundle bundle, final RequestDispatcherImpl.RequestCompletioner requestCompletioner) {
        WeatherApi.sRefreshWeatherForRequestHandler.handleRequest(bundle.getString("location"),new Response<Void>() {
            @Override
            public void onSuccess(Void obj) {
              requestCompletioner.success(null);
            }

            @Override
            public void onError(String code, String message) {
              requestCompletioner.error(code, message);
            }
        });
      }
    });
    ElectrodeBridge.registerRequestHandler(Names.GET_TEMPERATURE_FOR, new RequestDispatcherImpl.RequestHandler() {
      @Override
      public void onRequest(Bundle bundle, final RequestDispatcherImpl.RequestCompletioner requestCompletioner) {
        WeatherApi.sGetTemperatureForRequestHandler.handleRequest(bundle.getString("location"),new Response<Integer>() {
            @Override
            public void onSuccess(Integer obj) {
              Bundle bundle = new Bundle(); bundle.putInt("rsp", obj);
              requestCompletioner.success(bundle);
            }

            @Override
            public void onError(String code, String message) {
              requestCompletioner.error(code, message);
            }
        });
      }
    });
    ElectrodeBridge.registerRequestHandler(Names.GET_CURRENT_TEMPERATURE, new RequestDispatcherImpl.RequestHandler() {
      @Override
      public void onRequest(Bundle bundle, final RequestDispatcherImpl.RequestCompletioner requestCompletioner) {
        WeatherApi.sGetCurrentTemperatureRequestHandler.handleRequest(new Response<Integer>() {
            @Override
            public void onSuccess(Integer obj) {
              Bundle bundle = new Bundle(); bundle.putInt("rsp", obj);
              requestCompletioner.success(bundle);
            }

            @Override
            public void onError(String code, String message) {
              requestCompletioner.error(code, message);
            }
        });
      }
    });
    ElectrodeBridge.registerRequestHandler(Names.GET_CURRENT_LOCATIONS, new RequestDispatcherImpl.RequestHandler() {
      @Override
      public void onRequest(Bundle bundle, final RequestDispatcherImpl.RequestCompletioner requestCompletioner) {
        WeatherApi.sGetCurrentLocationsRequestHandler.handleRequest(new Response<String[]>() {
            @Override
            public void onSuccess(String[] obj) {
              Bundle bundle = new Bundle(); bundle.putStringArray("rsp", obj);
              requestCompletioner.success(bundle);
            }

            @Override
            public void onError(String code, String message) {
              requestCompletioner.error(code, message);
            }
        });
      }
    });
    ElectrodeBridge.registerRequestHandler(Names.GET_LOCATION, new RequestDispatcherImpl.RequestHandler() {
      @Override
      public void onRequest(Bundle bundle, final RequestDispatcherImpl.RequestCompletioner requestCompletioner) {
        WeatherApi.sGetLocationRequestHandler.handleRequest(new Response<LatLong>() {
            @Override
            public void onSuccess(LatLong obj) {
              Bundle bundle = obj.toBundle();
              requestCompletioner.success(bundle);
            }

            @Override
            public void onError(String code, String message) {
              requestCompletioner.error(code, message);
            }
        });
      }
    });
    ElectrodeBridge.registerRequestHandler(Names.SET_LOCATION, new RequestDispatcherImpl.RequestHandler() {
      @Override
      public void onRequest(Bundle bundle, final RequestDispatcherImpl.RequestCompletioner requestCompletioner) {
        WeatherApi.sSetLocationRequestHandler.handleRequest(LatLong.fromBundle(bundle),new Response<Void>() {
            @Override
            public void onSuccess(Void obj) {
              requestCompletioner.success(null);
            }

            @Override
            public void onError(String code, String message) {
              requestCompletioner.error(code, message);
            }
        });
      }
    });
  }
}
