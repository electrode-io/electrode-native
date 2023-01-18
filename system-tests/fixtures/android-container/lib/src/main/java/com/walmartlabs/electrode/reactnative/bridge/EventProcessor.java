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
import androidx.annotation.Nullable;

import com.walmartlabs.electrode.reactnative.bridge.helpers.Logger;

import java.util.UUID;

/**
 * Processes an event that is emitted from Native side
 *
 * @param <T> eventPayload
 */

public class EventProcessor<T> {
    private static final String TAG = EventProcessor.class.getSimpleName();

    private final T eventPayload;
    private final String eventName;

    public EventProcessor(@NonNull String eventName, @Nullable T eventPayload) {
        this.eventPayload = eventPayload;
        this.eventName = eventName;
    }

    @SuppressWarnings("unchecked")
    public void execute() {
        Logger.d(TAG, "EventProcessor is emitting event(%s), with payload(%s)", eventName, eventPayload);
        ElectrodeBridgeHolder.emitEvent(new ElectrodeBridgeEvent.Builder(eventName)
                .withData(eventPayload)
                .build());
    }
}
