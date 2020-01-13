/*
 * Copyright 2017 WalmartLabs
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.walmartlabs.electrode.reactnative.bridge;

import android.os.Handler;
import android.os.Looper;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.support.annotation.VisibleForTesting;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.walmartlabs.electrode.reactnative.bridge.helpers.Logger;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import static com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgeRequest.NO_TIMEOUT;

/**
 * Class that is responsible for transmitting messages between native and react native
 */
class ElectrodeBridgeTransceiver extends ReactContextBaseJavaModule implements ElectrodeNativeBridge, ElectrodeReactBridge {

    private static final String TAG = ElectrodeBridgeTransceiver.class.getSimpleName();

    private final ReactContextWrapper mReactContextWrapper;

    // Singleton instance of the bridge
    private static ElectrodeBridgeTransceiver sInstance;

    private static final ConcurrentHashMap<String, BridgeTransaction> sPendingTransactions = new ConcurrentHashMap<>();
    private static final EventRegistrar<ElectrodeBridgeEventListener<ElectrodeBridgeEvent>> sEventRegistrar = new EventRegistrarImpl<>();
    private static final EventDispatcher sEventDispatcher = new EventDispatcherImpl(sEventRegistrar);
    private static final RequestRegistrar<ElectrodeBridgeRequestHandler<ElectrodeBridgeRequest, Object>> sRequestRegistrar = new RequestRegistrarImpl<>();
    private static final RequestDispatcher sRequestDispatcher = new RequestDispatcherImpl(sRequestRegistrar);
    private static final List<ConstantsProvider> sConstantsProviders = new ArrayList<>();
    private static boolean sIsReactNativeReady;

    /**
     * Initializes a new instance of ElectrodeBridgeTransceiver
     *
     * @param reactContextWrapper The react application context
     */
    private ElectrodeBridgeTransceiver(@NonNull ReactContextWrapper reactContextWrapper) {
        super(reactContextWrapper.getContext());
        mReactContextWrapper = reactContextWrapper;
    }

    /**
     * Creates the ElectrodeBridgeTransceiver singleton
     *
     * @param reactApplicationContext The react application context
     * @return The singleton instance of ElectrodeBridgeTransceiver
     */
    static ElectrodeBridgeTransceiver create(ReactApplicationContext reactApplicationContext) {
        return create(new ReactContextWrapperInternal(reactApplicationContext));
    }

    /**
     * Creates the ElectrodeBridgeTransceiver singleton
     *
     * @param reactContextWrapper {@link ReactContextWrapper}
     * @return The singleton instance of ElectrodeBridgeTransceiver
     */
    @VisibleForTesting
    static ElectrodeBridgeTransceiver create(@NonNull ReactContextWrapper reactContextWrapper) {
        Logger.d(TAG, "Creating ElectrodeBridgeTransceiver instance");
        sInstance = new ElectrodeBridgeTransceiver(reactContextWrapper);
        return sInstance;
    }

    /**
     * Returns the singleton instance of the bridge
     */
    public static ElectrodeBridgeTransceiver instance() {
        if (sInstance == null) {
            throw new IllegalStateException("Bridge transceiver instance has not been created yet. Transceiver requires a valid ReactContext to get initialized. Make sure to that BridgePackage is added to react module which normally initializes transceiver.");
        }
        return sInstance;
    }

    /**
     * @return the name of this module. This will be the name used to {@code require()} this module
     * from javascript.
     */
    @Override
    public String getName() {
        return "ElectrodeBridge";
    }

    @Nullable
    @Override
    public Map<String, Object> getConstants() {
        if (sConstantsProviders != null && !sConstantsProviders.isEmpty()) {
            Map<String, Object> constants = new HashMap<>();
            try {
                for (ConstantsProvider provider : sConstantsProviders) {
                    Map<String, Object> providerConstants;
                    if ((providerConstants = provider.getConstants()) != null) {
                        constants.putAll(providerConstants);
                    }
                }
                return constants;
            } catch (Exception e) {
                //GOTCHA: Added a try catch since the implementation of this would be on the client side and bridge has no control over unseen errors.
                Logger.w(TAG, "getConstants() implementation by(%s) failed due to(%s)", sConstantsProviders, e.getMessage());
            }
        }
        return super.getConstants();
    }

    @NonNull
    @Override
    public boolean addEventListener(@NonNull String name, @NonNull ElectrodeBridgeEventListener<ElectrodeBridgeEvent> eventListener, @NonNull UUID uuid) {
        Logger.d(TAG, "Adding eventListener(%s) for event(%s)", eventListener, name);
        return sEventRegistrar.registerEventListener(name, eventListener, uuid);
    }

    /**
     * Registers the {@link ConstantsProvider} that will be used by the bridge module to get the constant values exposed to JavaScript
     *
     * @param constantsProvider
     */
    public static void addConstantsProvider(@NonNull ConstantsProvider constantsProvider) {
        sConstantsProviders.add(constantsProvider);
    }

    @Nullable
    @Override
    public UUID getRequestHandlerId(@NonNull String name) {
        return sRequestRegistrar.getRequestHandlerId(name);
    }

    @NonNull
    @Override
    public UUID getEventListenerId(@NonNull ElectrodeBridgeEventListener<ElectrodeBridgeEvent> eventListener) {
        return sEventRegistrar.getEventListenerId(eventListener);
    }

    @Override
    public ElectrodeBridgeEventListener<ElectrodeBridgeEvent> removeEventListener(@NonNull UUID eventListenerUuid) {
        return sEventRegistrar.unregisterEventListener(eventListenerUuid);
    }

    @Override
    public ElectrodeBridgeRequestHandler<ElectrodeBridgeRequest, Object> unregisterRequestHandler(@NonNull UUID requestHandlerUuid) {
        return sRequestRegistrar.unregisterRequestHandler(requestHandlerUuid);
    }

    @Override
    public boolean registerRequestHandler(@NonNull String name, @NonNull ElectrodeBridgeRequestHandler<ElectrodeBridgeRequest, Object> requestHandler, @NonNull UUID uuid) {
        return sRequestRegistrar.registerRequestHandler(name, requestHandler, uuid);
    }

    /**
     * Emits an event with some data to the JS react native side
     *
     * @param event The event to emit
     */
    @SuppressWarnings("unused")
    @Override
    public void sendEvent(@NonNull ElectrodeBridgeEvent event) {
        Logger.d(TAG, "Emitting event[name:%s id:%s]", event.getName(), event.getId());

        notifyReactEventListeners(event);
        notifyLocalEventListeners(event);
    }


    /**
     * Sends a request
     *
     * @param request          The request to send
     * @param responseListener Listener to be called upon request completion
     */
    @SuppressWarnings("unused")
    @Override
    public void sendRequest(@NonNull final ElectrodeBridgeRequest request, @NonNull final ElectrodeBridgeResponseListener<ElectrodeBridgeResponse> responseListener) {
        handleRequest(request, responseListener);
    }

    /**
     * This method is used by react native to dispatch an event on the native side.
     * <p>
     * This could be a REQUEST, RESPONSE, or an EVENT
     *
     * @param data The event data
     */
    @ReactMethod
    @Override
    public void sendMessage(@NonNull final ReadableMap data) {
        Logger.d(TAG, "received message from JS(data=%s)", data);
        BridgeMessage.Type type = BridgeMessage.Type.getType(data.getString(BridgeMessage.BRIDGE_MSG_TYPE));
        if (type != null) {
            switch (type) {
                case EVENT:
                    ElectrodeBridgeEvent event = ElectrodeBridgeEvent.create(data);
                    if (event != null) {
                        Logger.d(TAG, "Received message is an EVENT(name=%s), will notify local event listeners.", event.getName());
                        notifyLocalEventListeners(event);
                    } else {
                        throw new IllegalArgumentException("Unable to construct event from data");
                    }
                    break;
                case REQUEST:
                    ElectrodeBridgeRequest request = ElectrodeBridgeRequest.create(data);
                    if (request != null) {
                        Logger.d(TAG, "Received message is a REQUEST(name=%s), will look for a request handler and forward this request", request.getName());
                        handleRequest(request, null);
                    } else {
                        throw new IllegalArgumentException("Unable to construct request from data");
                    }

                    break;
                case RESPONSE:
                    ElectrodeBridgeResponse response = ElectrodeBridgeResponse.create(data);
                    if (response != null) {
                        Logger.d(TAG, "Received message is a RESPONSE for a request(name=%s, id=%s)", response.getName(), response.getId());
                        handleResponse(response);
                    } else {
                        throw new IllegalArgumentException("Unable to construct a response from data");
                    }

                    break;
            }
        } else {
            throw new IllegalArgumentException("Unable to identify request type. Should never reach here.");
        }
    }

    private void handleRequest(@NonNull final ElectrodeBridgeRequest request, @Nullable ElectrodeBridgeResponseListener<ElectrodeBridgeResponse> responseListener) {
        logRequest(request);

        if (responseListener == null && !request.isJsInitiated()) {
            throw new IllegalArgumentException("A response lister is required for a non-JS initiated request");
        }

        final BridgeTransaction bridgeTransaction = createTransaction(request, responseListener);

        if (sRequestDispatcher.canHandleRequest(request.getName())) {
            dispatchRequestToLocalHandler(bridgeTransaction);
        } else if (!request.isJsInitiated()) {//GOTCHA: Should not send a request back JS if it was initiated from JS side.
            dispatchRequestToReact(bridgeTransaction);
        } else {
            Logger.d(TAG, "No handler available to handle the request(id=%s, name=%s). Will fail the request", request.getId(), request.getName());
            handleResponse(ElectrodeBridgeResponse.createResponseForRequest(request, null, BridgeFailureMessage.create("ENOHANDLER", "No registered request handler found for " + request.getName())));
        }
    }

    @NonNull
    private BridgeTransaction createTransaction(@NonNull ElectrodeBridgeRequest request, @Nullable ElectrodeBridgeResponseListener<ElectrodeBridgeResponse> responseListener) {
        final BridgeTransaction bridgeTransaction = new BridgeTransaction(request, responseListener);
        sPendingTransactions.put(request.getId(), bridgeTransaction);
        startTimeOutCheckForTransaction(bridgeTransaction);
        return bridgeTransaction;
    }

    private void startTimeOutCheckForTransaction(@NonNull final BridgeTransaction transaction) {
        if (transaction.getRequest().getTimeoutMs() != NO_TIMEOUT) {
            Handler handler = new Handler(Looper.getMainLooper());
            handler.postDelayed(new Runnable() {
                public void run() {
                    Logger.d(TAG, "Checking timeout for request(id=%s)", transaction.getRequest().getId());
                    handleResponse(ElectrodeBridgeResponse.createResponseForRequest(transaction.getRequest(), null, BridgeFailureMessage.create("EREQUESTTIMEOUT", "Request timeout")));
                }
            }, transaction.getRequest().getTimeoutMs());
        } else {
            Logger.d(TAG, "NO_TIMEOUT request, Will skip timeout check for request(%s)", transaction.getRequest());
        }
    }

    private void dispatchRequestToLocalHandler(@NonNull final BridgeTransaction transaction) {
        Logger.d(TAG, "Sending request(id=%s) to local handler", transaction.getRequest().getId());

        final ElectrodeBridgeRequest request = transaction.getRequest();
        sRequestDispatcher.dispatchRequest(transaction.getRequest(), new ElectrodeBridgeResponseListener<Object>() {
            @Override
            public void onFailure(@NonNull FailureMessage failureMessage) {
                ElectrodeBridgeResponse response = ElectrodeBridgeResponse.createResponseForRequest(request, null, failureMessage);
                handleResponse(response);
            }

            @Override
            public void onSuccess(@Nullable Object responseData) {
                ElectrodeBridgeResponse response = ElectrodeBridgeResponse.createResponseForRequest(request, responseData, null);
                handleResponse(response);
            }
        });

    }

    private void dispatchRequestToReact(@NonNull BridgeTransaction bridgeTransaction) {
        Logger.d(TAG, "Sending request(id=%s) over to JS side as there is no local request handler available", bridgeTransaction.getId());
        mReactContextWrapper.emitEvent(bridgeTransaction.getRequest());
    }

    private void handleResponse(@NonNull ElectrodeBridgeResponse bridgeResponse) {
        Logger.d(TAG, "Handling bridge response");
        BridgeTransaction transaction = sPendingTransactions.get(bridgeResponse.getId());
        if (transaction != null) {
            transaction.setResponse(bridgeResponse);
            completeTransaction(transaction);
        } else {
            Logger.i(TAG, "Response(id=%s, name=%s) will be ignored as the transaction for this request has already been removed from the queue. Perhaps it's already timed-out or completed", bridgeResponse.getId(), bridgeResponse.getName());
        }

    }

    private void notifyLocalEventListeners(@NonNull final ElectrodeBridgeEvent event) {
        mReactContextWrapper.runOnUiQueueThread(new Runnable() {
            @Override
            public void run() {
                sEventDispatcher.dispatchEvent(event);
            }
        });
    }

    private void notifyReactEventListeners(@NonNull ElectrodeBridgeEvent event) {
        mReactContextWrapper.emitEvent(event);
    }

    private void completeTransaction(@NonNull final BridgeTransaction transaction) {
        if (transaction.getResponse() == null) {
            throw new IllegalArgumentException("Cannot complete transaction, a transaction can only be completed with a valid response.");
        }
        Logger.d(TAG, "completing transaction(%s)", transaction.getId());

        sPendingTransactions.remove(transaction.getId());

        final ElectrodeBridgeResponse response = transaction.getResponse();
        logResponse(response);

        if (transaction.isJsInitiated()) {
            Logger.d(TAG, "Completing by emitting event to JS since the request was initiated from JS side.");
            mReactContextWrapper.emitEvent(response);
        } else {
            if (transaction.getFinalResponseListener() != null) {
                if (response.getFailureMessage() != null) {
                    Logger.d(TAG, "Completing by issuing a failure call back to local response listener.");
                    mReactContextWrapper.runOnUiQueueThread(new Runnable() {
                        @Override
                        public void run() {
                            transaction.getFinalResponseListener().onFailure(response.getFailureMessage());
                        }
                    });
                } else {
                    Logger.d(TAG, "Completing by issuing a success call back to local response listener.");
                    mReactContextWrapper.runOnUiQueueThread(new Runnable() {
                        @Override
                        public void run() {
                            transaction.getFinalResponseListener().onSuccess(response);
                        }
                    });
                }
            } else {
                throw new IllegalArgumentException("Should never reach here, a response listener should always be set for a local transaction");
            }

        }

    }

    private void logRequest(@NonNull ElectrodeBridgeRequest request) {
        Logger.d(TAG, "--> --> --> --> --> Request(id=%s, name=%s, isJS=%s)", request.getId(), request.getName(), request.isJsInitiated());
    }

    private void logResponse(ElectrodeBridgeResponse response) {
        Logger.d(TAG, "<-- <-- <-- <-- <-- Response(id=%s, name=%s, data=%s, error=%s) received", response.getId(), response.getName(), response.getData(), response.getFailureMessage());
    }

    public interface ReactNativeReadyListener {
        void onReactNativeReady();
    }

    private static ReactNativeReadyListener sReactNativeReadyListener;

    public static void registerReactNativeReadyListener(ReactNativeReadyListener listener) {
        // If react native initialization is already completed, just call listener
        // immediately
        if (sIsReactNativeReady) {
            listener.onReactNativeReady();
        }
        // Else it will get invoked whenever react native initialization is done
        else {
            sReactNativeReadyListener = listener;
        }
    }

    public void onReactNativeInitialized() {
        sIsReactNativeReady = true;
        if (sReactNativeReadyListener != null) {
            sReactNativeReadyListener.onReactNativeReady();
        }
    }

    /**
     * Method for testing only
     */
    @VisibleForTesting
    void debug_ClearRequestHandlerRegistrar() {
        ((RequestRegistrarImpl) sRequestRegistrar).reset();
    }
}
