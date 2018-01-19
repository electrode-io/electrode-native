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

package com.walmartlabs.ern.container;

import android.app.Activity;
import android.app.Application;
import android.content.Intent;
import android.os.Build;
import android.provider.Settings;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.util.Log;

import java.lang.reflect.Method;
import java.lang.reflect.InvocationTargetException;
import java.util.List;
import java.util.ArrayList;

import okhttp3.OkHttpClient;

import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.SafeActivityStarter;
import com.facebook.react.modules.network.OkHttpClientProvider;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactInstanceManagerBuilder;
import com.facebook.react.ReactPackage;
import com.facebook.react.common.LifecycleState;
import com.facebook.react.shell.MainReactPackage;
{{#plugins}}
import com.walmartlabs.ern.container.plugins.{{name}};
{{/plugins}}
{{#apiImplementations}}
import com.ern.api.impl.{{apiName}}ApiController;
{{#hasConfig}}
import com.ern.api.impl.{{apiName}}ApiRequestHandlerProvider;
{{/hasConfig}}
{{/apiImplementations}}

public class ElectrodeReactContainer {
    private static String TAG = ElectrodeReactContainer.class.getSimpleName();

    private static ElectrodeReactContainer sInstance;
    private static boolean sIsReactNativeReady;
    private static List<ReactNativeReadyListener> reactNativeReadyListeners = new ArrayList<>();

    private final boolean isReactNativeDeveloperSupport;
    private final ReactInstanceManager mReactInstanceManager;

    private ElectrodeReactContainer(Application application
            , Config reactContainerConfig
              {{#plugins}}
              {{#configurable}}
            , {{{name}}}.Config {{{lcname}}}Config
            {{/configurable}}
            {{/plugins}}
    ) {
        // ReactNative general config
        this.isReactNativeDeveloperSupport = reactContainerConfig.isReactNativeDeveloperSupport;

        // Replace OkHttpClient with client provided instance, if any
        if (reactContainerConfig.okHttpClient != null) {
          OkHttpClientProvider.replaceOkHttpClient(reactContainerConfig.okHttpClient);
        }

        // Ask for overlay permission for the application if
        // developper mode is enabled and android version is Marshmallow
        // or above
        if (reactContainerConfig.isReactNativeDeveloperSupport &&
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.M &&
                !Settings.canDrawOverlays(application)) {
          Intent serviceIntent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION);
          serviceIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
          application.startActivity(serviceIntent);
        }

        final ReactInstanceManagerBuilder reactInstanceManagerBuilder = ReactInstanceManager.builder()
                .setApplication(application)
                .setBundleAssetName("index.android.bundle")
                {{#RN_VERSION_GTE_49}}
                .setJSMainModulePath("index.android")
                {{/RN_VERSION_GTE_49}}
                {{#RN_VERSION_LT_49}}
                .setJSMainModuleName("index.android")
                {{/RN_VERSION_LT_49}}
                .addPackage(new MainReactPackage())
                .setUseDeveloperSupport(reactContainerConfig.isReactNativeDeveloperSupport)
                .setInitialLifecycleState(LifecycleState.BEFORE_CREATE);

        final List<ReactPackage> reactPackages = new ArrayList<>();
        {{#plugins}}
        {{#configurable}}
        reactPackages.add(new {{name}}().hook(application, reactInstanceManagerBuilder, {{lcname}}Config));
        {{/configurable}}
        {{^configurable}}
        reactPackages.add(new {{name}}().hook(application, reactInstanceManagerBuilder));
        {{/configurable}}
        {{/plugins}}

        mReactInstanceManager = reactInstanceManagerBuilder.build();
        mReactInstanceManager.addReactInstanceEventListener(new ReactInstanceManager.ReactInstanceEventListener() {
        @Override
        public void onReactContextInitialized(ReactContext context) {
            sIsReactNativeReady = true;
            notifyReactNativeReadyListeners();
            for (ReactPackage instance : reactPackages) {
                try {
                    Method onReactNativeInitialized =
                    instance.getClass().getMethod("onReactNativeInitialized");
                    onReactNativeInitialized.invoke(instance);
                }
                catch (NoSuchMethodException e) {}
                catch (IllegalAccessException e) {
                    Log.e(TAG, "Container Initialization failed: " + e.getMessage());
                }
                catch (InvocationTargetException e) {
                    Log.e(TAG, "Container Initialization failed: " + e.getMessage());
                }
            }
        }
        });
    }

    @SuppressWarnings("WeakerAccess")
    public synchronized static ReactInstanceManager getReactInstanceManager() {
        throwIfNotInitialized();
        return sInstance.mReactInstanceManager;
    }

    public static ElectrodeReactContainer getInstance() {
        throwIfNotInitialized();
        return sInstance;
    }

    @SuppressWarnings("unused")
    public static void startActivitySafely(Intent intent) {
        throwIfNotInitialized();
        if (null != sInstance.mReactInstanceManager && null != sInstance.mReactInstanceManager.getCurrentReactContext()) {
            new SafeActivityStarter(sInstance.mReactInstanceManager.getCurrentReactContext(), intent).startActivity();
        } else {
            Log.w(TAG, "startActivitySafely: Unable to start activity, react context or instance manager is null");
        }
    }

    @SuppressWarnings("unused")
    @Nullable
    public static Activity getCurrentActivity() {
        throwIfNotInitialized();
        if (null != sInstance.mReactInstanceManager && null != sInstance.mReactInstanceManager.getCurrentReactContext()) {
            return sInstance.mReactInstanceManager.getCurrentReactContext().getCurrentActivity();
        }
        return null;
    }

    @SuppressWarnings("unused")
    public static ReactContext getCurrentReactContext() {
        throwIfNotInitialized();
        if (null != sInstance.mReactInstanceManager) {
            return sInstance.mReactInstanceManager.getCurrentReactContext();
        }
        return null;
    }

    @SuppressWarnings("UnusedReturnValue")
    public synchronized static ElectrodeReactContainer initialize(@NonNull Application application, @NonNull final Config reactContainerConfig
            {{#plugins}}
            {{#configurable}}
            , @NonNull final {{name}}.Config {{lcname}}Config
            {{/configurable}}
            {{/plugins}}
            {{#apiImplementations}}
            {{#hasConfig}}
            , @NonNull final {{apiName}}ApiRequestHandlerProvider.{{apiName}}ApiConfig {{apiVariableName}}ApiConfig
            {{/hasConfig}}
            {{/apiImplementations}}
     ) {
        if (null == sInstance) {
             sInstance = new ElectrodeReactContainer(application, reactContainerConfig
                    {{#plugins}}
                    {{#configurable}}
                    ,{{lcname}}Config
                    {{/configurable}}
                    {{/plugins}});

            // Load bundle now (engine might offer lazy loading later down the road)
            getReactInstanceManager().createReactContextInBackground();

            {{#apiImplementations}}
            {{apiName}}ApiController.register({{#hasConfig}}{{apiVariableName}}ApiConfig{{/hasConfig}}{{^hasConfig}}null{{/hasConfig}});
            {{/apiImplementations}}

            Log.d(TAG, "ELECTRODE REACT-NATIVE ENGINE INITIALIZED\n" + reactContainerConfig.toString());
        }

        return sInstance;
    }


    
    @SuppressWarnings("WeakerAccess")
    public boolean isReactNativeDeveloperSupport() {
        return this.isReactNativeDeveloperSupport;
    }

    /**
     * Indicates if the react native context is initialized successfully.
     * @return true | false
     */
    @SuppressWarnings("unused")
    public static boolean isReactNativeReady() {
        return sIsReactNativeReady;
    }

    public static class Config {
        private boolean isReactNativeDeveloperSupport;
        private OkHttpClient okHttpClient;

        public Config isReactNativeDeveloperSupport(boolean value) {
            isReactNativeDeveloperSupport = value;
            return this;
        }

        @SuppressWarnings("unused")
        public Config useOkHttpClient(OkHttpClient value) {
            okHttpClient = value;
            return this;
        }

        @Override
        public String toString() {
            return "Config{" +
                    "isReactNativeDeveloperSupport=" + isReactNativeDeveloperSupport +
                    '}';
        }
    }

    @SuppressWarnings("unused")
    public static void registerReactNativeReadyListener(ReactNativeReadyListener listener) {
        // If react native initialization is already completed, just call listener
        // immediately
        if (sIsReactNativeReady) {
            listener.onReactNativeReady();
        }
        // Else it will get invoked whenever react native initialization is done
        else {
            reactNativeReadyListeners.add(listener);
        }
    }

    private static void notifyReactNativeReadyListeners() {
        for (ReactNativeReadyListener listener : reactNativeReadyListeners) {
            listener.onReactNativeReady();
        }
    }

    @SuppressWarnings("unused")
    public static void resetReactNativeReadyListeners() {
        reactNativeReadyListeners.clear();
    }

    public interface ReactNativeReadyListener {
        void onReactNativeReady();
    }

    private static void throwIfNotInitialized() {
        if (sInstance == null) {
            throw new IllegalStateException("ElectrodeReactContainer not initialized. ElectrodeReactContainer.initialize() method needs to be called before you can get a ReactInstanceManager instance");
        }
    }

}
