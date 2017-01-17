package com.walmartlabs.ern.weather.api;

import android.os.Bundle;

import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridge;
import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgeEvent;
import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgeHolder;
import com.walmartlabs.electrode.reactnative.bridge.RequestDispatcherImpl;
import com.walmartlabs.electrode.reactnative.bridge.ExistingHandlerException;
import com.walmartlabs.electrode.reactnative.bridge.helpers.RequestHandler;
import com.walmartlabs.electrode.reactnative.bridge.helpers.RequestHandlerEx;
import com.walmartlabs.electrode.reactnative.bridge.helpers.Response;
import com.walmartlabs.ern.weather.model.LatLng;

public final class WeatherApi {

  private static ElectrodeBridge sElectrodeBridge;

  //====================================================================
  // Request Handlers declaration (Private)
  //====================================================================

  private static RequestHandler sRefreshWeatherRequestHandler;
  private static RequestHandlerEx<String,Void> sRefreshWeatherForRequestHandler;
  private static RequestHandlerEx<String,Integer> sGetTemperatureForRequestHandler;
  private static RequestHandler<Integer> sGetCurrentTemperatureRequestHandler;
  private static RequestHandler<int[]> sGetCurrentTemperaturesRequestHandler;

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
  public static void handleGetCurrentTemperaturesRequest(RequestHandler<int[]> handler) {
      sGetCurrentTemperaturesRequestHandler = handler;
  }

  //====================================================================
  // Events emition (Public client surface)
  //====================================================================

  public static void weatherUpdated() {
      weatherUpdated(ElectrodeBridgeEvent.DispatchMode.JS);
  }

  public static void weatherUpdated(final ElectrodeBridgeEvent.DispatchMode dispatchMode) {
      sElectrodeBridge.emitEvent(new ElectrodeBridgeEvent.Builder(Names.WEATHER_UPDATED)
                                     .withDispatchMode(dispatchMode)
                                     .build());
  }
  public static void weatherUdpatedAtLocation(String location) {
      weatherUdpatedAtLocation(location, ElectrodeBridgeEvent.DispatchMode.JS);
  }

  public static void weatherUdpatedAtLocation(String location, final ElectrodeBridgeEvent.DispatchMode dispatchMode) {
      Bundle bundle = new Bundle(); bundle.putString("location",                 location);
      sElectrodeBridge.emitEvent(new ElectrodeBridgeEvent.Builder(Names.WEATHER_UDPATED_AT_LOCATION)
                                     .withDispatchMode(dispatchMode)
                                     .withData(bundle)
                                     .build());
  }
  public static void weatherUpdatedAtPosition(LatLng position) {
      weatherUpdatedAtPosition(position, ElectrodeBridgeEvent.DispatchMode.JS);
  }

  public static void weatherUpdatedAtPosition(LatLng position, final ElectrodeBridgeEvent.DispatchMode dispatchMode) {
      Bundle bundle = position.toBundle();
      sElectrodeBridge.emitEvent(new ElectrodeBridgeEvent.Builder(Names.WEATHER_UPDATED_AT_POSITION)
                                     .withDispatchMode(dispatchMode)
                                     .withData(bundle)
                                     .build());
  }

  //====================================================================
  // Bridge initialization
  //====================================================================

  static {
    ElectrodeBridgeHolder.setOnBridgeReadyListener(
      new ElectrodeBridgeHolder.OnBridgeReadyListener() {
        @Override
        public void onBridgeReady(ElectrodeBridge electrodeBridge) {
          WeatherApi.sElectrodeBridge = electrodeBridge;

          //====================================================================
          // Registration of request handlers with bridge
          //====================================================================

          try {
            electrodeBridge.requestRegistrar().registerRequestHandler(Names.REFRESH_WEATHER, new RequestDispatcherImpl.RequestHandler() {
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
            electrodeBridge.requestRegistrar().registerRequestHandler(Names.REFRESH_WEATHER_FOR, new RequestDispatcherImpl.RequestHandler() {
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
            electrodeBridge.requestRegistrar().registerRequestHandler(Names.GET_TEMPERATURE_FOR, new RequestDispatcherImpl.RequestHandler() {
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
            electrodeBridge.requestRegistrar().registerRequestHandler(Names.GET_CURRENT_TEMPERATURE, new RequestDispatcherImpl.RequestHandler() {
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
            electrodeBridge.requestRegistrar().registerRequestHandler(Names.GET_CURRENT_TEMPERATURES, new RequestDispatcherImpl.RequestHandler() {
                @Override
                public void onRequest(Bundle bundle, final RequestDispatcherImpl.RequestCompletioner requestCompletioner) {
                  WeatherApi.sGetCurrentTemperaturesRequestHandler.handleRequest(new Response<int[]>() {
                      @Override
                      public void onSuccess(int[] obj) {
                        Bundle bundle = new Bundle(); bundle.putIntArray("rsp", obj);
                        requestCompletioner.success(bundle);
                      }

                      @Override
                      public void onError(String code, String message) {
                        requestCompletioner.error(code, message);
                      }
                  });
                }
              });
          } catch(ExistingHandlerException ex) {
          }
        }
     });
  }
}
