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

/**
 * Bridge failure message interface.
 */

public interface FailureMessage {

    /**
     * Error code
     *
     * @return String
     */
    @NonNull
    String getCode();

    /**
     * Error message, a user displayable error message.
     *
     * @return String
     */
    @NonNull
    String getMessage();


    /**
     * Optional exception that can be passed along to describe the failure.
     *
     * @return Exception
     */
    @SuppressWarnings("unused")
    @Nullable
    Throwable getException();


    /**
     * Optional debug message mainly used for debugging purpose. Provides insights into the failure.
     *
     * @return String
     */
    @SuppressWarnings("unused")
    @Nullable
    String getDebugMessage();
}
