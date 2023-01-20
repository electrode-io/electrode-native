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

import androidx.annotation.NonNull;

import com.walmartlabs.electrode.reactnative.bridge.helpers.Logger;

class RequestDispatcherImpl implements RequestDispatcher {
    private static final String TAG = RequestDispatcherImpl.class.getSimpleName();

    private final RequestRegistrar<ElectrodeBridgeRequestHandler<ElectrodeBridgeRequest, Object>> mRequestRegistrar;

    /**
     * Initialize a new RequestDispatcherImpl instance
     *
     * @param requestRegistrar The request registrar to use for this dispatcher
     */
    RequestDispatcherImpl(@NonNull RequestRegistrar<ElectrodeBridgeRequestHandler<ElectrodeBridgeRequest, Object>> requestRegistrar) {
        mRequestRegistrar = requestRegistrar;
    }

    @Override
    public void dispatchRequest(@NonNull final ElectrodeBridgeRequest bridgeRequest, @NonNull final ElectrodeBridgeResponseListener<Object> responseListener) {
        final String requestId = bridgeRequest.getId();
        final String requestName = bridgeRequest.getName();

        Logger.d(TAG, "dispatching request(id=%s) locally", requestId);
        ElectrodeBridgeRequestHandler<ElectrodeBridgeRequest, Object> requestHandler = mRequestRegistrar.getRequestHandler(requestName);
        if (requestHandler == null) {
            FailureMessage failureMessage = BridgeFailureMessage.create("ENOHANDLER", "No registered request handler for request name " + requestName);
            responseListener.onFailure(failureMessage);
            return;
        }
        requestHandler.onRequest(bridgeRequest,responseListener);
    }


    @Override
    public boolean canHandleRequest(@NonNull String name) {
        return mRequestRegistrar.getRequestHandler(name) != null;
    }
}
