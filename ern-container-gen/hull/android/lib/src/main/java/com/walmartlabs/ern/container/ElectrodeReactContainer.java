package com.walmartlabs.ern.container;

import android.app.Activity;
import android.app.Application;
import android.support.annotation.NonNull;
import android.util.Log;

import com.facebook.react.ReactInstanceManager;
import com.facebook.react.common.LifecycleState;
import com.facebook.react.shell.MainReactPackage;
{{#plugins}}
import com.walmartlabs.ern.container.plugins.{{name}};
{{/plugins}}

public class ElectrodeReactContainer {
    private static String TAG = ElectrodeReactContainer.class.getSimpleName();

    private static ReactInstanceManager.Builder reactInstanceManagerBuilder;
    private static ElectrodeReactContainer sInstance;
    private static ReactInstanceManager sReactInstanceManager;

    private final boolean isReactNativeDeveloperSupport;

    private ElectrodeReactContainer(Application application,
                                    Config reactContainerConfig
                            {{#plugins}}
                              {{#configurable}}
                              ,
                                {{^last}}
                                    {{name}}.Config {{lcname}}Config,
                                {{/last}}
                                {{#last}}
                                    {{name}}.Config {{lcname}}Config) {
                                {{/last}}
                              {{/configurable}}
                            {{/plugins}}
                            {{^plugins}}
                            ) {
                            {{/plugins}}
        // ReactNative general config
        this.isReactNativeDeveloperSupport = reactContainerConfig.isReactNativeDeveloperSupport;

        reactInstanceManagerBuilder = ReactInstanceManager.builder()
                .setApplication(application)
                .setBundleAssetName("index.android.bundle")
                .setJSMainModuleName("index.android")
                .addPackage(new MainReactPackage())
                .setUseDeveloperSupport(reactContainerConfig.isReactNativeDeveloperSupport)
                .setInitialLifecycleState(LifecycleState.BEFORE_CREATE);

      {{#plugins}}
        {{#configurable}}
        new {{name}}().hook(application, reactInstanceManagerBuilder, {{lcname}}Config);
        {{/configurable}}
        {{^configurable}}
        new {{name}}().hook(application, reactInstanceManagerBuilder);
        {{/configurable}}
      {{/plugins}}
    }

    public synchronized static ReactInstanceManager getReactInstanceManager() {
        if (null == sReactInstanceManager) {
            sReactInstanceManager = reactInstanceManagerBuilder.build();
        }

        return sReactInstanceManager;
    }

    public static ElectrodeReactContainer getInstance() {
        return sInstance;
    }

    public static Activity getCurrentActivity() {
        if (null != sReactInstanceManager) {
            return sReactInstanceManager.getCurrentReactContext().getCurrentActivity();
        }

        return null;
    }

    public synchronized static ElectrodeReactContainer initialize(
            @NonNull Application application,
            @NonNull final Config reactContainerConfig
    {{#plugins}}
      {{#configurable}}
      ,
        {{^last}}
            @NonNull final {{name}}.Config {{lcname}}Config,
        {{/last}}
        {{#last}}
            @NonNull final {{name}}.Config {{lcname}}Config) {
        {{/last}}
      {{/configurable}}
    {{/plugins}}
    {{^plugins}}
      ) {
    {{/plugins}}
        if (null == sInstance) {
            sInstance = new ElectrodeReactContainer(
                    application,
                    reactContainerConfig
            {{#plugins}}
              {{#configurable}}
              ,
                {{^last}}
                    {{lcname}}Config,
                {{/last}}
                {{#last}}
                    {{lcname}}Config);
                {{/last}}
              {{/configurable}}
            {{/plugins}}
            {{^plugins}}
              );
            {{/plugins}}

            // Load bundle now (engine might offer lazy loading later down the road)
            getReactInstanceManager().createReactContextInBackground();

            Log.d(TAG, "ELECTRODE REACT ENGINE INITIALIZED\n" + reactContainerConfig.toString());
        }

        return sInstance;
    }


    public boolean isReactNativeDeveloperSupport() {
        return this.isReactNativeDeveloperSupport;
    }

    public static class Config {
        private boolean isReactNativeDeveloperSupport;

        public Config isReactNativeDeveloperSupport(boolean value) {
            isReactNativeDeveloperSupport = value;
            return this;
        }

        @Override
        public String toString() {
            return "Config{" +
                    "isReactNativeDeveloperSupport=" + isReactNativeDeveloperSupport +
                    '}';
        }
    }
}
