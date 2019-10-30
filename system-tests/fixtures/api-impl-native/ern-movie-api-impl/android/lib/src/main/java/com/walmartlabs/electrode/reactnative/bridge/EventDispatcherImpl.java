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

import com.walmartlabs.electrode.reactnative.bridge.helpers.Logger;

public class EventDispatcherImpl implements EventDispatcher {

    private static final String TAG = EventDispatcherImpl.class.getSimpleName();

    private final EventRegistrar<ElectrodeBridgeEventListener<ElectrodeBridgeEvent>> mEventRegistrar;

    public EventDispatcherImpl(EventRegistrar<ElectrodeBridgeEventListener<ElectrodeBridgeEvent>> eventRegistrar) {
        mEventRegistrar = eventRegistrar;
    }

    @Override
    public void dispatchEvent(@NonNull ElectrodeBridgeEvent bridgeEvent) {
        for (ElectrodeBridgeEventListener<ElectrodeBridgeEvent> eventListener : mEventRegistrar.getEventListeners(bridgeEvent.getName())) {
            Logger.d(TAG, "Event dispatcher is dispatching event(%s), id(%s) to listener(%s)", bridgeEvent.getName(), bridgeEvent.getId(), eventListener);
            eventListener.onEvent(bridgeEvent);
        }
    }
}
