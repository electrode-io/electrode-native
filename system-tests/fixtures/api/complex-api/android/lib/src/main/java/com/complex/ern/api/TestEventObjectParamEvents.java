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
import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgeHolder;
import com.walmartlabs.electrode.reactnative.bridge.EventListenerProcessor;
import com.walmartlabs.electrode.reactnative.bridge.EventProcessor;
import com.walmartlabs.electrode.reactnative.bridge.None;

import java.util.*;
import java.util.UUID;

final class TestEventObjectParamEvents implements TestEventObjectParamApi.Events {
    TestEventObjectParamEvents() {
    }

    @Override
    public UUID addTestEventObjectParamEventListener(
            @NonNull final ElectrodeBridgeEventListener<TestEventObjectParamData> eventListener) {
        return new EventListenerProcessor<>(EVENT_TEST_EVENT_OBJECT_PARAM, TestEventObjectParamData.class, eventListener).execute();
    }

    @Override
    public ElectrodeBridgeEventListener<ElectrodeBridgeEvent> removeTestEventObjectParamEventListener(
            @NonNull final UUID uuid) {
        return ElectrodeBridgeHolder.removeEventListener(uuid);
    }

    @Override
    public void emitTestEventObjectParam(TestEventObjectParamData testEventObjectParamData) {
        new EventProcessor<>(EVENT_TEST_EVENT_OBJECT_PARAM, testEventObjectParamData).execute();
    }
}
