/*
 * Copyright 2020 Walmart Labs
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.complex.ern.api;

import android.support.annotation.NonNull;

import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgeEvent;
import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgeEventListener;
import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgeRequestHandler;
import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgeResponseListener;
import com.walmartlabs.electrode.reactnative.bridge.None;
import com.walmartlabs.electrode.reactnative.bridge.RequestHandlerHandle;

import java.util.*;
import java.util.UUID;


public final class TestEventObjectParamApi {
    private static final Requests REQUESTS;
    private static final Events EVENTS;

    static {
        REQUESTS = new TestEventObjectParamRequests();
        EVENTS = new TestEventObjectParamEvents();
    }

    private TestEventObjectParamApi() {
    }

    @NonNull
    public static Requests requests() {
        return REQUESTS;
    }

    @NonNull
    public static Events events() {
        return EVENTS;
    }

    public interface Events {
        String EVENT_TEST_EVENT_OBJECT_PARAM = "com.complex.ern.api.event.testEventObjectParam";

        UUID addTestEventObjectParamEventListener(
                @NonNull final ElectrodeBridgeEventListener<TestEventObjectParamData> eventListener);

        ElectrodeBridgeEventListener<ElectrodeBridgeEvent> removeTestEventObjectParamEventListener(
                @NonNull final UUID uuid);

        void emitTestEventObjectParam(@NonNull TestEventObjectParamData testEventObjectParamData);
    }

    public interface Requests {
    }
}
