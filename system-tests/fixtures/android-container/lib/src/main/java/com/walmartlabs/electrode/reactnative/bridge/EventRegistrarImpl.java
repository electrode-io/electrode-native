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
import androidx.annotation.VisibleForTesting;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

public class EventRegistrarImpl<T> implements EventRegistrar<T> {
    private final ConcurrentHashMap<UUID, T> mEventListenerByUUID = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, List<T>> mEventListenersByEventName = new ConcurrentHashMap<>();

    /**
     * Registers an event listener
     *
     * @param name              event name for the event listener
     * @param eventListener     event listener to register
     * @param eventListenerUuid event {@link UUID} for uniqueness
     * @return Returns true if the {@code eventListener} is registered
     */
    @NonNull
    public boolean registerEventListener(@NonNull String name, @NonNull T eventListener, @NonNull UUID eventListenerUuid) {
        boolean isRegistered;
        if (mEventListenersByEventName.containsKey(name)) {
            mEventListenersByEventName.get(name).add(eventListener);
        } else {
            List<T> eventListeners = new ArrayList<>();
            eventListeners.add(eventListener);
            mEventListenersByEventName.put(name, eventListeners);
        }
        mEventListenerByUUID.put(eventListenerUuid, eventListener);
        isRegistered = true;
        return isRegistered;
    }

    /**
     * Unregisters an event listener
     *
     * @param eventListenerUuid {@link UUID} that was obtained with registerEventListener method
     * @return eventListener unregistered
     */
    public T unregisterEventListener(@NonNull UUID eventListenerUuid) {
        T eventListener = mEventListenerByUUID.remove(eventListenerUuid);
        if (eventListener != null) {
            for (List<T> eventListeners : mEventListenersByEventName.values()) {
                if (eventListeners.contains(eventListener)) {
                    eventListeners.remove(eventListener);
                    break;
                }
            }
        }
        return eventListener;
    }

    /**
     * Gets the list of all event listeners registered for a given event name
     *
     * @param name The name of the event
     * @return A list of event listeners registered for the given event name or an empty list if no
     * <p>
     * event listeners are currently registered for this event name
     */
    @NonNull
    @Override
    public List<T> getEventListeners(@NonNull String name) {
        if (!mEventListenersByEventName.containsKey(name)) {
            return Collections.emptyList();
        }

        return Collections.unmodifiableList(mEventListenersByEventName.get(name));
    }

    @NonNull
    @Override
    public UUID getEventListenerId(@NonNull T eventListener) {
        for (Map.Entry entry : mEventListenerByUUID.entrySet()) {
            if (eventListener != null && eventListener.equals(entry.getValue())) {
                return (UUID) entry.getKey();
            }
        }
        return null;
    }

    /**
     * FOR TESTING ONLY
     */
    @VisibleForTesting
    void reset() {
        mEventListenerByUUID.clear();
        mEventListenersByEventName.clear();
    }
}
