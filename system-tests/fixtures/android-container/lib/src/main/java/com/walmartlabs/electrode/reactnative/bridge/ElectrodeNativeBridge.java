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

import android.support.annotation.NonNull;
import android.support.annotation.Nullable;

import java.util.UUID;

/**
 * Client facing bridge api. Defines all the actions that a native client can perform through the bridge.
 */

public interface ElectrodeNativeBridge {
    /**
     * Send a request from Android native to either Native or React Native side depending on where the request handler is registered.
     *
     * @param request          {@link ElectrodeBridgeRequest} that will contain the request name,data, destination mode, and timeout
     * @param responseListener the response call back listener to issue success or failure of the {@code request}.
     */
    void sendRequest(@NonNull final ElectrodeBridgeRequest request, @NonNull final ElectrodeBridgeResponseListener<ElectrodeBridgeResponse> responseListener);

    /**
     * Register the request handler, which will be used to handle any
     *
     * @param name           name of the request
     * @param requestHandler call back to be issued for a given request.
     * @param uuid           Returns true if the {@code requestHandler} is registered
     */
    boolean registerRequestHandler(@NonNull String name, @NonNull ElectrodeBridgeRequestHandler<ElectrodeBridgeRequest, Object> requestHandler, UUID uuid);

    /**
     * Sends an event with some data to the all the even listeners.
     *
     * @param event {@link ElectrodeBridgeEvent} to emit
     */
    void sendEvent(@NonNull ElectrodeBridgeEvent event);

    /**
     * Adds an event listener for the passed event
     *
     * @param name          The event name this listener is interested in
     * @param eventListener The event listener
     * @param uuid          {@link UUID} of the {@code name}
     * @return Returns true if the {@code eventListener} is registered
     */
    @NonNull
    boolean addEventListener(@NonNull String name, @NonNull ElectrodeBridgeEventListener<ElectrodeBridgeEvent> eventListener, UUID uuid);

    /**
     * Query UUID of the request handler
     *
     * @param name
     * @return {@link UUID} of the request handler
     */
    @Nullable
    UUID getRequestHandlerId(@NonNull String name);

    /**
     * Query UUID of the event listener
     *
     * @param eventListener
     * @return {@link UUID} of the event listener
     */
    @NonNull
    UUID getEventListenerId(@NonNull ElectrodeBridgeEventListener<ElectrodeBridgeEvent> eventListener);

    /**
     * Remove the event listener
     *
     * @param eventListenerUuid {@link UUID}
     * @return
     */
    ElectrodeBridgeEventListener<ElectrodeBridgeEvent> removeEventListener(@NonNull UUID eventListenerUuid);

    /**
     * Unregisters a request handler
     *
     * @param requestHandlerUuid {@link UUID} of registerRequestHandler
     * @return registerRequestHandler unregistered
     */
    @SuppressWarnings("unused")
    ElectrodeBridgeRequestHandler<ElectrodeBridgeRequest, Object> unregisterRequestHandler(@NonNull UUID requestHandlerUuid);

}
