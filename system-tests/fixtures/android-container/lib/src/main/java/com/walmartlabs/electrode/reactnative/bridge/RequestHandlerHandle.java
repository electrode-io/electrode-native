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

/**
 * Interface that is returned by the request handler processors when a request is being registered.
 * <p>
 * Use this handle to properly unregister the request handler when not in use.
 */
public interface RequestHandlerHandle {
    /**
     * Unregisters a request handler.
     *
     * @return
     */
    boolean unregister();
}
