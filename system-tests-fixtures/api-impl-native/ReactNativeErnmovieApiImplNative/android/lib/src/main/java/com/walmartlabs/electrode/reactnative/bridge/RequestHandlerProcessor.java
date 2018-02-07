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

import com.walmartlabs.electrode.reactnative.bridge.helpers.Logger;
import com.walmartlabs.electrode.reactnative.bridge.util.BridgeArguments;

import java.util.UUID;

/**
 * Class that handles a native request handler.
 * This class is responsible for converting the received bundle to a full fledged object before sending the request to the registered request handler
 * and also takes care of converting the response object to bundle.
 *
 * @param <TReq>
 * @param <TResp>
 */
public class RequestHandlerProcessor<TReq, TResp> implements Processor {
    private final String TAG = RequestHandlerProcessor.class.getSimpleName();

    private final String requestName;
    private final Class<TReq> reqClazz;
    private final Class<TResp> respClazz;
    private final ElectrodeBridgeRequestHandler<TReq, TResp> handler;

    public RequestHandlerProcessor(@NonNull String requestName, @NonNull Class<TReq> reqClazz, @NonNull Class<TResp> respClazz, @NonNull ElectrodeBridgeRequestHandler<TReq, TResp> handler) {
        this.requestName = requestName;
        this.reqClazz = reqClazz;
        this.respClazz = respClazz;
        this.handler = handler;
    }

    @SuppressWarnings("unchecked")
    @Override
    public UUID execute() {
        final ElectrodeBridgeRequestHandler<ElectrodeBridgeRequest, Object> intermediateRequestHandler = new ElectrodeBridgeRequestHandler<ElectrodeBridgeRequest, Object>() {

            @Override
            public void onRequest(@Nullable ElectrodeBridgeRequest bridgeRequest, @NonNull final ElectrodeBridgeResponseListener<Object> responseListener) {
                if (bridgeRequest == null) {
                    throw new IllegalArgumentException("BridgeRequest cannot be null, should never reach here");
                }

                Logger.d(TAG, "inside onRequest of RequestHandlerProcessor, with payload(%s)", bridgeRequest);
                TReq request;

                if (reqClazz == None.class) {
                    request = (TReq) None.NONE;
                } else {
                    request = (TReq) BridgeArguments.generateObject(bridgeRequest.getData(), reqClazz);
                }

                Logger.d(TAG, "Generated request(%s) from payload(%s) and ready to pass to registered handler", request, bridgeRequest);

                handler.onRequest(request, new ElectrodeBridgeResponseListener<TResp>() {
                    @Override
                    public void onFailure(@NonNull FailureMessage failureMessage) {
                        responseListener.onFailure(failureMessage);
                    }

                    @Override
                    public void onSuccess(TResp obj) {
                        Logger.d(TAG, "Received successful response(%s) from handler, now lets try to convert to real object for the response listener", obj);
                        responseListener.onSuccess(obj);
                    }
                });
            }
        };

        return ElectrodeBridgeHolder.registerRequestHandler(requestName, intermediateRequestHandler);
    }
}
