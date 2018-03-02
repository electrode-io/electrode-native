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

import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.SafeActivityStarter;
import com.facebook.react.modules.network.OkHttpClientProvider;
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
{{#loadJsBundleFromCustomPath}}
import com.microsoft.codepush.react.CodePush;
{{/loadJsBundleFromCustomPath}}

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import okhttp3.OkHttpClient;

public class ElectrodeReactContainer {
    private static String TAG = ElectrodeReactContainer.class.getSimpleName();

    @Deprecated
    private static final ElectrodeReactContainer sInstance = new ElectrodeReactContainer();
    private static boolean sIsReactNativeReady;
    private static List<ReactPackage> sReactPackages = new ArrayList<>();
    private static ElectrodeReactNativeHost sElectrodeReactNativeHost;

    private static boolean isReactNativeDeveloperSupport;

    private static List<ReactNativeReadyListener> reactNativeReadyListeners = new ArrayList<>();

    private ElectrodeReactContainer() {

    }

    public synchronized static ReactInstanceManager getReactInstanceManager() {
        throwIfNotInitialized();
        return sElectrodeReactNativeHost.getReactInstanceManager();
    }

    /**
     * @deprecated This method is deprecated. This class is converted to hold only util methods that allows you to initialize Electrode container and ReactNativeHost.
     * Start referring to all the static util methods that are exposed.
     */
    @SuppressWarnings("unused")
    @Deprecated
    public static ElectrodeReactContainer getInstance() {
        throwIfNotInitialized();
        return sInstance;
    }


    @SuppressWarnings("unused")
    public static void startActivitySafely(Intent intent) {
        throwIfNotInitialized();
        if (null != getReactInstanceManager() && null != getReactInstanceManager().getCurrentReactContext()) {
            new SafeActivityStarter(getReactInstanceManager().getCurrentReactContext(), intent).startActivity();
        } else {
            Log.w(TAG, "startActivitySafely: Unable to start activity, react context or instance manager is null");
        }
    }

    @SuppressWarnings("unused")
    @Nullable
    public static Activity getCurrentActivity() {
        throwIfNotInitialized();
        if (null != getReactInstanceManager() && null != getReactInstanceManager().getCurrentReactContext()) {
            return getReactInstanceManager().getCurrentReactContext().getCurrentActivity();
        }
        return null;
    }

    @SuppressWarnings("unused")
    public static ReactContext getCurrentReactContext() {
        throwIfNotInitialized();
        if (null != getReactInstanceManager()) {
            return getReactInstanceManager().getCurrentReactContext();
        }
        return null;
    }

    @SuppressWarnings("UnusedReturnValue")
    public synchronized static void initialize(@NonNull Application application, @NonNull final Config reactContainerConfig
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
        if (sElectrodeReactNativeHost == null) {
            sElectrodeReactNativeHost = new ElectrodeReactNativeHost(application);

            // ReactNative general config

            isReactNativeDeveloperSupport = reactContainerConfig.isReactNativeDeveloperSupport;

            // Replace OkHttpClient with client provided instance, if any
            if (reactContainerConfig.okHttpClient != null) {
                OkHttpClientProvider.replaceOkHttpClient(reactContainerConfig.okHttpClient);
            }

            askForOverlayPermissionIfDebug(application);

            sReactPackages.add(new MainReactPackage());
            {{#plugins}}
            {{#configurable}}
            sReactPackages.add(new {{name}}().hook(application, {{lcname}}Config));
            {{/configurable}}
            {{^configurable}}
            sReactPackages.add(new {{name}}().hook(application, null));
            {{/configurable}}
            {{/plugins}}
            sReactPackages.removeAll(Collections.singleton((ReactPackage)null));

            // Load bundle now (engine might offer lazy loading later down the road)
            getReactInstanceManager().createReactContextInBackground();

            {{#apiImplementations}}
            {{apiName}}ApiController.register({{#hasConfig}}{{apiVariableName}}ApiConfig{{/hasConfig}}{{^hasConfig}}null{{/hasConfig}});
            {{/apiImplementations}}

            Log.d(TAG, "ELECTRODE REACT-NATIVE ENGINE INITIALIZED\n" + reactContainerConfig.toString());
        } else {
            Log.i(TAG, "Ignoring duplicate initialize call, electrode container is already initialized or is being initialized");
        }
    }

    private static void askForOverlayPermissionIfDebug(Application application) {
        // Ask for overlay permission for the application if
        // developper mode is enabled and android version is Marshmallow
        // or above
        if (isReactNativeDeveloperSupport &&
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.M &&
                !Settings.canDrawOverlays(application)) {
            Intent serviceIntent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION);
            serviceIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            application.startActivity(serviceIntent);
        }
    }

    public static ReactNativeHost getReactNativeHost() {
        return sElectrodeReactNativeHost;
    }


    @SuppressWarnings("WeakerAccess")
    public static boolean isReactNativeDeveloperSupport() {
        return isReactNativeDeveloperSupport;
    }

    /**
     * Indicates if the react native context is initialized successfully.
     *
     * @return true | false
     */
    @SuppressWarnings("unused")
    public static boolean isReactNativeReady() {
        return sIsReactNativeReady;
    }

    public static boolean hasReactInstance() {
        return sElectrodeReactNativeHost != null && getReactInstanceManager() != null;
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
        if (sElectrodeReactNativeHost == null) {
            throw new IllegalStateException("ElectrodeReactContainer not initialized. ElectrodeReactContainer.initialize() method needs to be called before you can get a ReactNativeHost instance");
        }
    }

    private static class ElectrodeReactNativeHost extends ReactNativeHost {

        private ElectrodeReactNativeHost(Application application) {
            super(application);
        }

        @Override
        public boolean getUseDeveloperSupport() {
            return isReactNativeDeveloperSupport;
        }

        @Override
        protected List<ReactPackage> getPackages() {
            return sReactPackages;
        }

        @javax.annotation.Nullable
        @Override
        protected String getBundleAssetName() {
            return "index.android.bundle";
        }

        @Override
        protected String getJSMainModuleName() {
            return "index.android";
        }

        @Override
        protected ReactInstanceManager createReactInstanceManager() {
            ReactInstanceManager reactInstanceManager = super.createReactInstanceManager();
            reactInstanceManager.addReactInstanceEventListener(new ReactInstanceManager.ReactInstanceEventListener() {
                @Override
                public void onReactContextInitialized(ReactContext context) {
                    sIsReactNativeReady = true;
                    notifyReactNativeReadyListeners();
                    for (ReactPackage instance : getPackages()) {
                        try {
                            Method onReactNativeInitialized =
                                    instance.getClass().getMethod("onReactNativeInitialized");
                            onReactNativeInitialized.invoke(instance);
                        } catch (NoSuchMethodException e) {
                            //Expected since not all react packages would have onReactNativeInitialized() method.
                        } catch (IllegalAccessException e) {
                            Log.e(TAG, "IllegalAccessException: Container Initialization failed: " + e.getMessage());
                            e.printStackTrace();
                        } catch (InvocationTargetException e) {
                            Log.e(TAG, "InvocationTargetException: Container Initialization failed: " + e.getMessage());
                            e.printStackTrace();
                        }
                    }
                }
            });
            return reactInstanceManager;
        }
        
        {{#loadJsBundleFromCustomPath}}
        @javax.annotation.Nullable
        @Override
        protected String getJSBundleFile() {
            return CodePush.getJSBundleFile();
        }
        {{/loadJsBundleFromCustomPath}}
    }
}
