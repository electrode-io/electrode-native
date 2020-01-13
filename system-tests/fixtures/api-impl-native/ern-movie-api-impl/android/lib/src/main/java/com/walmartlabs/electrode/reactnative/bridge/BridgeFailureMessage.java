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
import android.support.annotation.Nullable;

public class BridgeFailureMessage implements FailureMessage {

    private final String code;
    private final String message;
    private final Exception exception;
    private final String debugMessage;

    private BridgeFailureMessage(@NonNull String code, @NonNull String message, @Nullable Exception exception, @Nullable String debugMessage) {
        this.code = code;
        this.message = message;
        this.exception = exception;

        if (debugMessage == null) {
            this.debugMessage = exception != null ? exception.getMessage() : null;
        } else {
            this.debugMessage = debugMessage;
        }
    }

    public static BridgeFailureMessage create(@NonNull String code, @NonNull String message) {
        return new BridgeFailureMessage(code, message, null, null);
    }

    public static BridgeFailureMessage create(@NonNull String code, @NonNull String message, @Nullable Exception exception) {
        return new BridgeFailureMessage(code, message, exception, null);
    }

    public static BridgeFailureMessage create(@NonNull String code, @NonNull String message, @Nullable String debugMessage) {
        return new BridgeFailureMessage(code, message, null, debugMessage);
    }

    @NonNull
    @Override
    public String getCode() {
        return code;
    }

    @NonNull
    @Override
    public String getMessage() {
        return message;
    }


    @Nullable
    @Override
    public Throwable getException() {
        return exception;
    }

    @Nullable
    @Override
    public String getDebugMessage() {
        return debugMessage;
    }

    @Override
    public String toString() {
        return getClass().getSimpleName()
                + "-> code:" + code
                + ", message:" + message
                + ", exeception:" + exception
                + ", debugMessage:" + debugMessage;
    }
}
