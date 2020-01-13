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
import android.support.annotation.VisibleForTesting;

import com.walmartlabs.electrode.reactnative.bridge.helpers.Logger;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

public class RequestRegistrarImpl<T> implements RequestRegistrar<T> {
    private static final String TAG = RequestRegistrarImpl.class.getSimpleName();

    private final ConcurrentHashMap<UUID, String> mRequestNameByUUID = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, T> mRequestHandlerByRequestName = new ConcurrentHashMap<>();

    /**
     * Registers a request handler
     *
     * @param name               The request name this handler can handle
     * @param requestHandler     The request handler instance
     * @param requestHandlerUuid {@link UUID} of {@code requestHandler}
     * @return Returns true if the {@code requestHandler} is registered
     */
    @NonNull
    public boolean registerRequestHandler(@NonNull String name, @NonNull T requestHandler, @NonNull UUID requestHandlerUuid) {
        boolean isRegistered;
        if (mRequestHandlerByRequestName.get(name) != null) {
            Logger.d(TAG, "A request handler for request(name: %s) already exist. Replacing with a new request handler", name);
            removeOldUuidMapping(name);
        }
        mRequestHandlerByRequestName.put(name, requestHandler);
        mRequestNameByUUID.put(requestHandlerUuid, name);
        isRegistered = true;
        Logger.d(TAG, "New request handler(id: %s) registered for request: %s", requestHandlerUuid, name);
        return isRegistered;
    }

    /**
     * Unregisters a request handler
     *
     * @param requestHandlerUuid {@link UUID} of registerRequestHandler
     * @return registerRequestHandler unregistered
     */
    public T unregisterRequestHandler(@NonNull UUID requestHandlerUuid) {
        String requestName = mRequestNameByUUID.remove(requestHandlerUuid);
        if (requestName != null) {
            Logger.d(TAG, "Request handler(id: %s) removed for request: %s", requestHandlerUuid, requestName);
            return mRequestHandlerByRequestName.remove(requestName);
        } else {
            Logger.d(TAG, "Request handler(id: %s) already removed", requestHandlerUuid);
        }
        return null;
    }

    /**
     * Gets the request handler registered for a given request name
     *
     * @param name The name of request
     * @return The request handler instance that can handle this request name or null if no such
     * request handler was registered
     */
    @Nullable
    public T getRequestHandler(@NonNull String name) {
        return mRequestHandlerByRequestName.get(name);
    }

    @Nullable
    @Override
    public UUID getRequestHandlerId(@NonNull String name) {
        for (Map.Entry entry : mRequestNameByUUID.entrySet()) {
            if (name.equals(entry.getValue())) {
                return (UUID) entry.getKey();
            }
        }
        return null;
    }

    private void removeOldUuidMapping(@NonNull String name) {
        UUID oldUuid = getRequestHandlerId(name);
        if (oldUuid != null) {
            Logger.d(TAG, "Removing old request handler(id: %s)", oldUuid);
            mRequestNameByUUID.remove(oldUuid);
        }
    }

    /**
     * ONLY FOR TESTING
     * <p>
     * Clear all registered request handlers.
     */
    @VisibleForTesting
    void reset() {
        mRequestNameByUUID.clear();
        mRequestHandlerByRequestName.clear();
    }
}
