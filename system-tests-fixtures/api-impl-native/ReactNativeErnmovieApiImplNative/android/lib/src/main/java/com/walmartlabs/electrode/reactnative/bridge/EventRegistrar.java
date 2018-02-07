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

import java.util.List;
import java.util.UUID;

public interface EventRegistrar<T> {

    /**
     * Registers an event listener
     *
     * @param name          event name for the event listener
     * @param eventListener event listener to register
     * @param uuid          event {@link UUID} for uniqueness
     * @return Returns true if the {@code eventListener} is registered
     */
    @NonNull
    boolean registerEventListener(@NonNull String name, @NonNull T eventListener, @NonNull UUID uuid);

    /**
     * Unregisters an event listener
     *
     * @param eventListenerUuid {@link UUID} with which eventListener was registered
     * @return eventListener unregistered
     */
    T unregisterEventListener(@NonNull UUID eventListenerUuid);

    /**
     * Gets the list of all event listeners registered for a given event name
     *
     * @param name The name of the event
     * @return A list of event listeners registered for the given event name or an empty list if no
     * <p>
     * event listeners are currently registered for this event name
     */
    @NonNull
    List<T> getEventListeners(@NonNull String name);

    /**
     * Query UUID of the event listener
     *
     * @param eventListener
     * @return {@link UUID} of the event listener
     */
    @NonNull
    UUID getEventListenerId(@NonNull T eventListener);

}
