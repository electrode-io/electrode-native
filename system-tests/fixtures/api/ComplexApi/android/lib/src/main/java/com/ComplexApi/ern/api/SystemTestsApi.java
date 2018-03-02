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

package com.ComplexApi.ern.api;

import android.support.annotation.NonNull;

import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgeEventListener;
import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgeEvent;
import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgeRequestHandler;
import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgeResponseListener;
import com.walmartlabs.electrode.reactnative.bridge.None;
import java.util.*;
import java.util.UUID;

import com.ComplexApi.ern.model.ErnObject;

public final class SystemTestsApi {
    private static final Requests REQUESTS;

    static {
        REQUESTS = new SystemTestsRequests();
    }

    private SystemTestsApi() {
    }

    @NonNull
    public static Requests requests() {
        return REQUESTS;
    }



    public interface Requests {
        String REQUEST_TEST_ARRAY_OF_STRINGS = "com.ComplexApi.ern.api.request.testArrayOfStrings";
        String REQUEST_TEST_MULTI_ARGS = "com.ComplexApi.ern.api.request.testMultiArgs";


        void registerTestArrayOfStringsRequestHandler(@NonNull final ElectrodeBridgeRequestHandler<List<String>, List<ErnObject>> handler);

        void registerTestMultiArgsRequestHandler(@NonNull final ElectrodeBridgeRequestHandler<TestMultiArgsData, String> handler);

        void testArrayOfStrings(List<String> key, @NonNull final ElectrodeBridgeResponseListener<List<ErnObject>> responseListener);

        void testMultiArgs(TestMultiArgsData testMultiArgsData, @NonNull final ElectrodeBridgeResponseListener<String> responseListener);

    }
}