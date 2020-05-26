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

package com.walmartlabs.ern.container;

import com.walmartlabs.electrode.reactnative.bridge.helpers.Logger;
import com.walmartlabs.ern.container.devassist.ErnDevSettingsActivity;
import com.walmartlabs.ern.container.plugins.BridgePlugin;

import android.app.Activity;
import android.app.Application;
import android.content.Intent;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.util.Log;

import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.SafeActivityStarter;
import com.facebook.react.devsupport.interfaces.DevOptionHandler;
import com.facebook.react.modules.network.OkHttpClientFactory;
import com.facebook.react.modules.network.OkHttpClientProvider;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import okhttp3.OkHttpClient;

public class ElectrodeReactContainer {
    private static final String TAG = "ElectrodeReactContainer";

    private static final ElectrodeReactContainer sInstance = new ElectrodeReactContainer();

    private static boolean sIsReactNativeReady;
    private static List<ReactPackage> sReactPackages = new ArrayList<>();
    private static ElectrodeReactNativeHost sElectrodeReactNativeHost;
    private static Config sConfig;

    private static boolean isReactNativeDeveloperSupport;

    private static List<ReactNativeReadyListener> reactNativeReadyListeners = new ArrayList<>();

    private ElectrodeReactContainer() {
    }

    public static synchronized ReactInstanceManager getReactInstanceManager() {
        throwIfNotInitialized();
        return sElectrodeReactNativeHost.getReactInstanceManager();
    }

    /**
     * @deprecated This method is deprecated. This class is converted to hold only util methods that
     * allows you to initialize Electrode container and ReactNativeHost. Start referring to all
     * the static util methods that are exposed.
     */
    @SuppressWarnings("unused")
    @Deprecated
    public static ElectrodeReactContainer getInstance() {
        throwIfNotInitialized();
        return sInstance;
    }

    @SuppressWarnings("unused")
    public static boolean startActivitySafely(@NonNull Intent intent) {
        throwIfNotInitialized();
        if (null != getReactInstanceManager()
                && null != getReactInstanceManager().getCurrentReactContext()) {
            new SafeActivityStarter(getReactInstanceManager().getCurrentReactContext(), intent)
                    .startActivity();
            return true;
        } else {
            Log.w(TAG, "startActivitySafely: Unable to start activity");
            return false;
        }
    }

    @SuppressWarnings("unused")
    @Nullable
    public static Activity getCurrentActivity() {
        throwIfNotInitialized();
        if (null != getReactInstanceManager()
                && null != getReactInstanceManager().getCurrentReactContext()) {
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

    @SuppressWarnings("unused")
    public static Config getConfig() {
        throwIfNotInitialized();
        return sConfig;
    }

    @SuppressWarnings("UnusedReturnValue")
    public static synchronized void initialize(
            @NonNull final Application application, @NonNull Config reactContainerConfig
    ) {
        if (sElectrodeReactNativeHost == null) {
            sConfig = reactContainerConfig;

            SoLoader.init(application, /* native exopackage */ false);

            // ReactNative general config

            isReactNativeDeveloperSupport = reactContainerConfig.isReactNativeDeveloperSupport;
            // Set the default log level to DEBUG for dev mode
            if (isReactNativeDeveloperSupport) {
                Logger.overrideLogLevel(Logger.LogLevel.DEBUG);
            }

            // Replace OkHttpClient with client provided instance, if any
            if (reactContainerConfig.okHttpClient != null) {
                OkHttpClientProvider.setOkHttpClientFactory(
                        new OkHttpClientFactoryImpl(reactContainerConfig.okHttpClient));
            }

            sElectrodeReactNativeHost = new ElectrodeReactNativeHost(application);

            sReactPackages.add(new MainReactPackage());
            sReactPackages.add(new BridgePlugin().hook(application, null));
            sReactPackages.removeAll(Collections.singleton((ReactPackage) null));

            // Add Electrode Native Settings item to React Native dev menu
            getReactInstanceManager()
                    .getDevSupportManager()
                    .addCustomDevOption(
                            "Electrode Native Settings",
                            new DevOptionHandler() {
                                @Override
                                public void onOptionSelected() {
                                    Intent intent =
                                            new Intent(application, ErnDevSettingsActivity.class);
                                    intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                                    application.startActivity(intent);
                                }
                            });

            // Load bundle now (engine might offer lazy loading later down the road)
            getReactInstanceManager().createReactContextInBackground();


            Log.d(
                    TAG,
                    "ELECTRODE REACT-NATIVE ENGINE INITIALIZED\n"
                            + reactContainerConfig.toString());
        } else {
            Log.i(
                    TAG,
                    "Ignoring duplicate initialize call, electrode container is already"
                            + " initialized or is being initialized");
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

    @SuppressWarnings("unused")
    public static void registerReactNativeReadyListener(ReactNativeReadyListener listener) {
        // If react native initialization is already completed, just call listener immediately,
        // otherwise it will get invoked whenever react native initialization is done
        if (sIsReactNativeReady) {
            listener.onReactNativeReady();
        } else {
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

    private static void throwIfNotInitialized() {
        if (sElectrodeReactNativeHost == null) {
            throw new IllegalStateException(
                    "ElectrodeReactContainer not initialized. Call"
                            + " ElectrodeReactContainer.initialize() before using this class");
        }
    }

    public interface ReactNativeReadyListener {
        void onReactNativeReady();
    }

    public static class Config {
        private boolean isReactNativeDeveloperSupport;
        private OkHttpClient okHttpClient;
        private String bundleStoreHostPort = "localhost:3000";

        public Config isReactNativeDeveloperSupport(boolean value) {
            isReactNativeDeveloperSupport = value;
            return this;
        }

        @SuppressWarnings("unused")
        public Config useOkHttpClient(OkHttpClient value) {
            okHttpClient = value;
            return this;
        }

        @SuppressWarnings("unused")
        public Config bundleStoreHostPort(String value) {
            bundleStoreHostPort = value;
            return this;
        }

        @SuppressWarnings("unused")
        public String getBundleStoreHostPort() {
            return bundleStoreHostPort;
        }

        @Override
        public String toString() {
            return "Config{"
                    + "isReactNativeDeveloperSupport="
                    + isReactNativeDeveloperSupport
                    + "bundleStoreHostPort="
                    + bundleStoreHostPort
                    + '}';
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

        @Nullable
        @Override
        protected String getBundleAssetName() {
            return "index.android.bundle";
        }

        @Override
        protected String getJSMainModuleName() {
            return "index";
        }

        @Override
        protected ReactInstanceManager createReactInstanceManager() {
            ReactInstanceManager reactInstanceManager = super.createReactInstanceManager();
            reactInstanceManager.addReactInstanceEventListener(
                    new ReactInstanceManager.ReactInstanceEventListener() {
                        @Override
                        public void onReactContextInitialized(ReactContext context) {
                            sIsReactNativeReady = true;
                            notifyReactNativeReadyListeners();
                            for (ReactPackage instance : getPackages()) {
                                try {
                                    Method onReactNativeInitialized =
                                            instance.getClass()
                                                    .getMethod("onReactNativeInitialized");
                                    onReactNativeInitialized.invoke(instance);
                                } catch (NoSuchMethodException e) {
                                    // Expected since not all react packages would have
                                    // onReactNativeInitialized() method.
                                } catch (IllegalAccessException e) {
                                    Log.e(
                                            TAG,
                                            "IllegalAccessException: Container Initialization"
                                                    + " failed: "
                                                    + e.getMessage());
                                    e.printStackTrace();
                                } catch (InvocationTargetException e) {
                                    Log.e(
                                            TAG,
                                            "InvocationTargetException: Container Initialization"
                                                    + " failed: "
                                                    + e.getMessage());
                                    e.printStackTrace();
                                }
                            }
                        }
                    });
            return reactInstanceManager;
        }
    }

    private static class OkHttpClientFactoryImpl implements OkHttpClientFactory {
        private final OkHttpClient mOkHttpClient;

        private OkHttpClientFactoryImpl(@NonNull OkHttpClient okHttpClient) {
            mOkHttpClient = okHttpClient;
        }

        @Override
        public OkHttpClient createNewNetworkModuleClient() {
            return mOkHttpClient;
        }
    }
}
