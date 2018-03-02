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

import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgeHolder;
import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgeRequestHandler;
import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgeResponseListener;
import com.walmartlabs.electrode.reactnative.bridge.None;
import com.walmartlabs.electrode.reactnative.bridge.RequestHandlerProcessor;
import com.walmartlabs.electrode.reactnative.bridge.RequestProcessor;
import java.util.*;
import com.ComplexApi.ern.model.ErnObject;


final class SystemTestsRequests implements SystemTestsApi.Requests {
    SystemTestsRequests() {}


    @Override
    public void registerTestArrayOfStringsRequestHandler(@NonNull final ElectrodeBridgeRequestHandler<List<String>, List<ErnObject>> handler) {
        new RequestHandlerProcessor<>(REQUEST_TEST_ARRAY_OF_STRINGS, (Class) String.class, (Class) ErnObject.class, handler).execute();
    }

    @Override
    public void registerTestMultiArgsRequestHandler(@NonNull final ElectrodeBridgeRequestHandler<TestMultiArgsData, String> handler) {
        new RequestHandlerProcessor<>(REQUEST_TEST_MULTI_ARGS, TestMultiArgsData.class, String.class, handler).execute();
    }

    //------------------------------------------------------------------------------------------------------------------------------------

    @Override
    public void testArrayOfStrings(List<String> key,@NonNull final ElectrodeBridgeResponseListener<List<ErnObject>> responseListener) {
        new RequestProcessor<>(REQUEST_TEST_ARRAY_OF_STRINGS,  key, (Class) List.class, ErnObject.class, responseListener).execute();
    }
    @Override
    public void testMultiArgs(TestMultiArgsData testMultiArgsData,@NonNull final ElectrodeBridgeResponseListener<String> responseListener) {
        new RequestProcessor<>(REQUEST_TEST_MULTI_ARGS,  testMultiArgsData, String.class, responseListener).execute();
    }
}