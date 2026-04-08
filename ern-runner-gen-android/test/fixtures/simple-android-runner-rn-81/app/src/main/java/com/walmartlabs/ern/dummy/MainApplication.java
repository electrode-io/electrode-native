package com.walmartlabs.ern.dummy;

import android.app.Application;

import com.walmartlabs.ern.container.ElectrodeReactContainer;

public class MainApplication extends Application {
    @Override
    public void onCreate() {
        super.onCreate();

        // Add additional plugin configuration below
        ElectrodeReactContainer.initialize(
                this,
                new ElectrodeReactContainer.Config()
                        .isReactNativeDeveloperSupport(RunnerConfig.RN_DEV_SUPPORT_ENABLED)
        );
    }
}
