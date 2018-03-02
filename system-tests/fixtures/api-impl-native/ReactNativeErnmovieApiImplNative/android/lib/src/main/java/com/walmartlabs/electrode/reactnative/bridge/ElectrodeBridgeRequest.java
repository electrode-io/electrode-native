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

import com.facebook.react.bridge.ReadableMap;
import com.walmartlabs.electrode.reactnative.bridge.helpers.Logger;

public class ElectrodeBridgeRequest extends BridgeMessage {
    private static final String TAG = ElectrodeBridgeRequest.class.getSimpleName();
    private static final int DEFAULT_REQUEST_TIMEOUT_MS = 5000;
    public static final int NO_TIMEOUT = -1;

    private final int mTimeoutMs;
    private boolean isJsInitiated;

    @Nullable
    public static ElectrodeBridgeRequest create(@NonNull ReadableMap messageMap) {
        ElectrodeBridgeRequest bridgeRequest = null;
        if (isValid(messageMap, BridgeMessage.Type.REQUEST)) {
            bridgeRequest = new ElectrodeBridgeRequest(messageMap);
        } else {
            Logger.w(TAG, "Unable to createMessage a bridge message, invalid data received(%s)", messageMap);
        }
        return bridgeRequest;
    }

    private ElectrodeBridgeRequest(@NonNull ReadableMap messageMap) {
        super(messageMap);
        mTimeoutMs = NO_TIMEOUT;
        isJsInitiated = true;
    }

    private ElectrodeBridgeRequest(Builder requestBuilder) {
        super(requestBuilder.mName, getUUID(), BridgeMessage.Type.REQUEST, requestBuilder.mData);
        mTimeoutMs = requestBuilder.mTimeoutMs;

    }

    /**
     * @return The timeout of this request
     */
    public int getTimeoutMs() {
        return this.mTimeoutMs;
    }

    /**
     * Indicates if a request was initiated by JS.
     *
     * @return true | false
     */
    public boolean isJsInitiated() {
        return isJsInitiated;
    }

    public static class Builder {
        private final String mName;
        private Object mData;
        private int mTimeoutMs;

        /**
         * Initializes a new request builder
         *
         * @param name The name of the request to build
         */
        public Builder(String name) {
            mName = name;
            mTimeoutMs = DEFAULT_REQUEST_TIMEOUT_MS;
            mData = null;
        }

        /**
         * Specifies the request timeout
         *
         * @param timeoutMs The timeout in milliseconds
         * @return Current builder instance for chaining
         */
        @SuppressWarnings("unused")
        public Builder withTimeout(int timeoutMs) {
            this.mTimeoutMs = timeoutMs;
            return this;
        }

        /**
         * Specifies the request data
         *
         * @param data The data
         * @return Current builder instance for chaining
         */
        public Builder withData(Object data) {
            this.mData = data;
            return this;
        }

        /**
         * Builds the request
         *
         * @return The built request
         */
        public ElectrodeBridgeRequest build() {
            return new ElectrodeBridgeRequest(this);
        }
    }
}
