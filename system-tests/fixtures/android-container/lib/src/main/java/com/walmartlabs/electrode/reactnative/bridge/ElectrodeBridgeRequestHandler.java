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

/**
 * Provide method to be notified of incoming request.
 * An implementor of this interface is expected to handle any incoming request and provide a {@link ElectrodeBridgeResponseListener#onSuccess(Object)} or {@link ElectrodeBridgeResponseListener#onFailure(FailureMessage)} response.
 */
public interface ElectrodeBridgeRequestHandler<TReq, TResp> {
    /**
     * Called whenever a request matching this handler is received
     *
     * @param payload          The payload of the request, payload can be null for a request.
     * @param responseListener An instance of {@link ElectrodeBridgeResponseListener}
     */
    void onRequest(@Nullable TReq payload, @NonNull ElectrodeBridgeResponseListener<TResp> responseListener);
}
