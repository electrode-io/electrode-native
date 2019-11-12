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

package com.ern.api.impl;

import android.support.annotation.Nullable;

//
// GENERATED CODE: DO NOT MODIFY
//
// Do not modify the content of this file as it will be regenerated
// every time a regen-api-impl command is executed.
// See https://native.electrode.io/cli-commands/regen-api-impl

abstract class RequestHandlerProvider<T extends RequestHandlerConfig> {
    protected T mRequestHandlerConfig;

    /**
     * @param requestHandlerConfig Optional config to be passed to an api impl provider.
     */
    public RequestHandlerProvider(@Nullable T requestHandlerConfig) {
        mRequestHandlerConfig = requestHandlerConfig;
    }
}
