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

import android.support.annotation.NonNull;

import com.facebook.react.bridge.ReactApplicationContext;

/**
 * A wrapper that is used inside the bridge to communicate to react native modules.
 * <p>
 * This wrapper helps to provide multiple implementations to the bridge for mock support
 */

interface ReactContextWrapper {
    void emitEvent(@NonNull BridgeMessage event);

    void runOnUiQueueThread(@NonNull Runnable runnable);

    @NonNull
    ReactApplicationContext getContext();
}
