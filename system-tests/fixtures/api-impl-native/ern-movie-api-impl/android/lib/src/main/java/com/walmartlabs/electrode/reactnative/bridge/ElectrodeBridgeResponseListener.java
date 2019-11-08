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
 * Provide methods to report response for a request.
 */
public interface ElectrodeBridgeResponseListener<TRsp> {
    /**
     * Successful response
     *
     * @param responseData response object{@link TRsp}
     */
    void onSuccess(@Nullable TRsp responseData);

    /**
     * Error response
     *
     * @param failureMessage {@link FailureMessage} with failure details.
     */
    void onFailure(@NonNull FailureMessage failureMessage);
}
