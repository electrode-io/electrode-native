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
 * Class that takes care of registering an event listener to the bridge.
 *
 * @param <T> Event payload type: Accepted types are Primitive wrappers and {@link Bridgeable}
 */

public class EventListenerProcessor<T> {
    private static final String TAG = EventListenerProcessor.class.getSimpleName();

    private final String eventName;
    private final Class<T> eventPayLoadClass;
    private final ElectrodeBridgeEventListener<T> eventListener;

    public EventListenerProcessor(@NonNull String eventName, @NonNull final Class<T> eventPayLoadClass, @NonNull final ElectrodeBridgeEventListener<T> eventListener) {
        this.eventName = eventName;
        this.eventPayLoadClass = eventPayLoadClass;
        this.eventListener = eventListener;
    }

    @SuppressWarnings("unchecked")
    public UUID execute() {
        ElectrodeBridgeEventListener<ElectrodeBridgeEvent> intermediateEventListener = new ElectrodeBridgeEventListener<ElectrodeBridgeEvent>() {
            @Override
            public void onEvent(@Nullable ElectrodeBridgeEvent bridgeEvent) {
                if (bridgeEvent == null) {
                    throw new IllegalArgumentException("bridgeEvent cannot be null, should never reach here");
                }

                Logger.d(TAG, "Processing final result for the event with payload bundle(%s)", bridgeEvent);

                T result = null;
                if (eventPayLoadClass != None.class) {
                    result = (T) BridgeArguments.generateObject(bridgeEvent.getData(), eventPayLoadClass);
                }

                eventListener.onEvent(result);
            }
        };
        return ElectrodeBridgeHolder.addEventListener(eventName, intermediateEventListener);
    }
}
