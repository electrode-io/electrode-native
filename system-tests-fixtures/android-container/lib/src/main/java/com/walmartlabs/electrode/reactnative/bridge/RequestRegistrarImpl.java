/*
 * Copyright 2017 WalmartLabs

 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at

 * http://www.apache.org/licenses/LICENSE-2.0

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

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

public class RequestRegistrarImpl<T> implements RequestRegistrar<T> {

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
        mRequestHandlerByRequestName.put(name, requestHandler);
        mRequestNameByUUID.put(requestHandlerUuid, name);
        isRegistered = true;
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
            return mRequestHandlerByRequestName.remove(requestName);
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

    @NonNull
    @Override
    public UUID getRequestHandlerId(@NonNull String name) {
        for (Map.Entry entry : mRequestNameByUUID.entrySet()) {
            if (name != null && name.equals(entry.getValue())) {
                return (UUID) entry.getKey();
            }
        }
        return null;
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
