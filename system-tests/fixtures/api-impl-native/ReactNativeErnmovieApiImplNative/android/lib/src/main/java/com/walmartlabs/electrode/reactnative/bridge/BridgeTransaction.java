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

public class BridgeTransaction {

    private final ElectrodeBridgeRequest request;
    private final ElectrodeBridgeResponseListener<ElectrodeBridgeResponse> finalResponseListener;
    private ElectrodeBridgeResponse response;


    public BridgeTransaction(@NonNull ElectrodeBridgeRequest request, @Nullable ElectrodeBridgeResponseListener<ElectrodeBridgeResponse> responseListener) {
        if (request.getType() != BridgeMessage.Type.REQUEST) {
            throw new IllegalArgumentException("BridgeTransaction constrictor expects a request type, did you accidentally pass in a different type(" + request.getType() + ") ? ");
        }
        this.request = request;
        this.finalResponseListener = responseListener;
    }


    public void setResponse(@NonNull ElectrodeBridgeResponse response) {
        this.response = response;
    }

    @NonNull
    public ElectrodeBridgeRequest getRequest() {
        return request;
    }

    @Nullable
    public ElectrodeBridgeResponseListener<ElectrodeBridgeResponse> getFinalResponseListener() {
        return finalResponseListener;
    }

    @Nullable
    public ElectrodeBridgeResponse getResponse() {
        return response;
    }

    @NonNull
    public String getId() {
        return request.getId();
    }

    public boolean isJsInitiated() {
        return request.isJsInitiated();
    }
}
