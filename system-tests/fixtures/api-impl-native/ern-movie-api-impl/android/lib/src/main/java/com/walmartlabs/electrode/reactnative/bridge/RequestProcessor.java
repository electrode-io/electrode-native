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

import com.walmartlabs.electrode.reactnative.bridge.helpers.Logger;
import com.walmartlabs.electrode.reactnative.bridge.util.BridgeArguments;

/**
 * This class takes care of processing a given request when {@link #execute()} is called on the instance.
 *
 * @param <TReq>
 * @param <TResp>
 */
public class RequestProcessor<TReq, TResp> {
    private final String TAG = RequestProcessor.class.getSimpleName();

    private final String requestName;
    private final TReq requestPayload;
    private final Class<TResp> responseClass;
    private final Class responseType;//Used when the TResp is List, represents the content type of the list. For non list, the response class and responseType will be same.
    private final ElectrodeBridgeResponseListener<TResp> responseListener;

    public RequestProcessor(@NonNull String requestName, @Nullable TReq requestPayload, @NonNull Class<TResp> respClass, @NonNull ElectrodeBridgeResponseListener<TResp> responseListener) {
        this(requestName, requestPayload, respClass, respClass, responseListener);
    }

    public RequestProcessor(@NonNull String requestName, @Nullable TReq requestPayload, @NonNull Class<TResp> respClass, @NonNull Class responseType, @NonNull ElectrodeBridgeResponseListener<TResp> responseListener) {
        this.requestName = requestName;
        this.requestPayload = requestPayload;
        this.responseClass = respClass;
        this.responseType = responseType;
        this.responseListener = responseListener;
    }

    @SuppressWarnings("unchecked")
    public void execute() {
        Logger.d(TAG, "Request processor started processing request(%s)", requestName);
        ElectrodeBridgeRequest req = new ElectrodeBridgeRequest.Builder(requestName)
                .withData(requestPayload)
                .build();

        ElectrodeBridgeHolder.sendRequest(req, new ElectrodeBridgeResponseListener<ElectrodeBridgeResponse>() {
            @Override
            public void onFailure(@NonNull FailureMessage failureMessage) {
                responseListener.onFailure(failureMessage);
            }

            @Override
            public void onSuccess(@Nullable ElectrodeBridgeResponse bridgeResponse) {
                if (bridgeResponse == null) {
                    throw new IllegalArgumentException("BridgeResponse cannot be null, should never reach here");
                }

                TResp response;
                if (responseClass == None.class) {
                    response = (TResp) None.NONE;
                } else {
                    response = (TResp) BridgeArguments.generateObject(bridgeResponse.getData(), responseType);
                }

                Logger.d(TAG, "Request processor received the final response(%s) for request(%s)", response, requestName);
                responseListener.onSuccess(response);
            }
        });
    }
}
