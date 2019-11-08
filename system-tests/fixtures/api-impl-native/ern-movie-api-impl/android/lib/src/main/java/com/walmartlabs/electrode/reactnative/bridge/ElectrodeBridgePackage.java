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

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class ElectrodeBridgePackage implements ReactPackage {

    @VisibleForTesting
    ElectrodeBridgeTransceiver electrodeBridgeTransceiver;

    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();
        this.electrodeBridgeTransceiver = ElectrodeBridgeTransceiver.create(reactContext);
        modules.add(electrodeBridgeTransceiver);
        return modules;
    }

    // Do not annotate the method with @Override
    // We want to provide backward compatibility starting react-native version 0.42
    // Breaking change in react-native version 0.47 : Android Remove unused createJSModules calls
    // Find more information here : https://github.com/facebook/react-native/releases/tag/v0.47.2
    // https://github.com/facebook/react-native/commit/ce6fb337a146e6f261f2afb564aa19363774a7a8
    public List<Class<? extends JavaScriptModule>> createJSModules() {
        return Collections.emptyList();
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }

    //
    // Invoked by ern platform once react native engine is initialized/ready
    public void onReactNativeInitialized() {
        this.electrodeBridgeTransceiver.onReactNativeInitialized();
    }

}
